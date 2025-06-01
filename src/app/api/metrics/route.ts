import { NextRequest, NextResponse } from 'next/server';

interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent?: string;
}

interface PerformanceReport {
  metrics: WebVitalsMetric[];
  timestamp: number;
  sessionId: string;
  userId?: string;
  buildId?: string;
}

// In-memory storage for metrics (in production, use a database)
const metricsStore: PerformanceReport[] = [];
const MAX_STORED_REPORTS = 1000; // Limit memory usage

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const report: PerformanceReport = await request.json();

    // Validate the report structure
    if (!isValidPerformanceReport(report)) {
      return NextResponse.json(
        { error: 'Invalid performance report format' },
        { status: 400 }
      );
    }

    // Store the report (in production, save to database)
    metricsStore.push(report);

    // Limit memory usage by removing old reports
    if (metricsStore.length > MAX_STORED_REPORTS) {
      metricsStore.splice(0, metricsStore.length - MAX_STORED_REPORTS);
    }

    // Log important metrics in development
    if (process.env.NODE_ENV === 'development') {
      report.metrics.forEach((metric) => {
        if (metric.rating === 'poor') {
          console.warn(
            `[METRICS] Poor ${metric.name}: ${metric.value}ms on ${metric.url}`
          );
        }
      });
    }

    // In production, you might want to:
    // 1. Save to database (PostgreSQL, MongoDB, etc.)
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Alert on poor performance
    // 4. Generate aggregated reports

    return NextResponse.json({
      success: true,
      received: report.metrics.length,
    });
  } catch (error) {
    console.error('[METRICS] Error processing performance report:', error);
    return NextResponse.json(
      { error: 'Failed to process performance report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '100'),
      1000
    );
    const format = url.searchParams.get('format') || 'json';

    let reports = [...metricsStore];

    // Filter by session if requested
    if (sessionId) {
      reports = reports.filter((report) => report.sessionId === sessionId);
    }

    // Sort by timestamp (newest first)
    reports.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    reports = reports.slice(0, limit);

    if (format === 'summary') {
      const summary = generateMetricsSummary(reports);
      return NextResponse.json(summary);
    }

    return NextResponse.json({
      reports,
      total: reports.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[METRICS] Error retrieving performance data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance data' },
      { status: 500 }
    );
  }
}

// Validation function
function isValidPerformanceReport(report: any): report is PerformanceReport {
  return (
    report &&
    typeof report === 'object' &&
    Array.isArray(report.metrics) &&
    typeof report.timestamp === 'number' &&
    typeof report.sessionId === 'string' &&
    report.metrics.every(isValidMetric)
  );
}

function isValidMetric(metric: any): metric is WebVitalsMetric {
  const validNames = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'];
  const validRatings = ['good', 'needs-improvement', 'poor'];

  return (
    metric &&
    typeof metric === 'object' &&
    typeof metric.id === 'string' &&
    validNames.includes(metric.name) &&
    typeof metric.value === 'number' &&
    validRatings.includes(metric.rating) &&
    typeof metric.timestamp === 'number' &&
    typeof metric.url === 'string'
  );
}

// Generate metrics summary
function generateMetricsSummary(reports: PerformanceReport[]) {
  const allMetrics = reports.flatMap((report) => report.metrics);
  const summary: Record<string, any> = {
    totalReports: reports.length,
    totalMetrics: allMetrics.length,
    timeRange: {
      start: Math.min(...reports.map((r) => r.timestamp)),
      end: Math.max(...reports.map((r) => r.timestamp)),
    },
    metrics: {},
  };

  // Group metrics by name
  const metricsByName = allMetrics.reduce(
    (acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    },
    {} as Record<string, WebVitalsMetric[]>
  );

  // Calculate statistics for each metric
  Object.entries(metricsByName).forEach(([name, metrics]) => {
    const values = metrics.map((m) => m.value);
    const ratings = metrics.map((m) => m.rating);

    summary.metrics[name] = {
      count: metrics.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      median: getMedian(values),
      p75: getPercentile(values, 75),
      p95: getPercentile(values, 95),
      min: Math.min(...values),
      max: Math.max(...values),
      ratings: {
        good: ratings.filter((r) => r === 'good').length,
        'needs-improvement': ratings.filter((r) => r === 'needs-improvement')
          .length,
        poor: ratings.filter((r) => r === 'poor').length,
      },
      ratingPercentages: {
        good: (
          (ratings.filter((r) => r === 'good').length / ratings.length) *
          100
        ).toFixed(1),
        'needs-improvement': (
          (ratings.filter((r) => r === 'needs-improvement').length /
            ratings.length) *
          100
        ).toFixed(1),
        poor: (
          (ratings.filter((r) => r === 'poor').length / ratings.length) *
          100
        ).toFixed(1),
      },
    };
  });

  return summary;
}

// Utility functions
function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function getPercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Health check for metrics endpoint
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}
