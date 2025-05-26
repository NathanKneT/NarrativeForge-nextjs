import { NextResponse } from 'next/server';
import React from 'react';

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database?: 'connected' | 'disconnected' | 'error';
    redis?: 'connected' | 'disconnected' | 'error';
    react: 'loaded' | 'missing' | 'error';
    nextjs: 'loaded' | 'missing' | 'error';
  };
  performance?: {
    memory: {
      used: number;
      total: number;
      free: number;
    };
    cpu?: number;
  } | undefined;
}

// Fonction pour vérifier l'état des services
function checkServices() {
  const services: HealthCheckResponse['services'] = {
    react: typeof React !== 'undefined' ? 'loaded' : 'missing',
    nextjs: 'loaded', // Si ce code s'exécute, Next.js fonctionne
  };

  // Vérifier d'autres services si nécessaire
  // services.database = await checkDatabaseConnection();
  // services.redis = await checkRedisConnection();

  return services;
}

// Fonction pour obtenir les métriques de performance
function getPerformanceMetrics(): HealthCheckResponse['performance'] {
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      return {
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024), // MB
        },
      };
    }
  } catch (error) {
    console.warn('Impossible d\'obtenir les métriques de performance:', error);
  }
  
  return undefined;
}

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  try {
    const startTime = process.hrtime.bigint();
    
    const services = checkServices();
    const performance = getPerformanceMetrics();
    
    const response: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services,
      performance,
    };

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${duration.toFixed(2)}ms`,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse: HealthCheckResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        react: 'error',
        nextjs: 'error',
      },
      performance: undefined,
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { message: 'POST method not supported for health check' },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { message: 'PUT method not supported for health check' },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { message: 'DELETE method not supported for health check' },
    { status: 405 }
  );
}