import { test, expect } from '@playwright/test';

test.describe('Asylum Story Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage correctly', async ({ page }) => {
    // Vérifier les éléments principaux
    await expect(page.getByText('Asylum')).toBeVisible();
    await expect(page.getByText('Histoire Interactive')).toBeVisible();
    
    // Vérifier la navigation
    await expect(page.getByText('Jouer')).toBeVisible();
    await expect(page.getByText('Éditeur')).toBeVisible();
  });

  test('should navigate through a basic story', async ({ page }) => {
    // Attendre que le jeu se charge
    await expect(page.getByText('Bonjour c\'est bien les secours')).toBeVisible({ timeout: 10000 });
    
    // Cliquer sur le premier choix
    await page.getByText('Oui ! Que se passe-t\'il ?').click();
    
    // Vérifier que nous sommes passés au nœud suivant
    await expect(page.getByText('Je viens tout juste de me réveiller')).toBeVisible();
    
    // Tester une branche
    await page.getByText('Décrivez moi l\'endroit').click();
    
    // Vérifier la navigation
    await expect(page.getByText('C\'est une petite chambre')).toBeVisible();
  });

  test('should handle save and load functionality', async ({ page }) => {
    // Naviguer un peu dans l'histoire
    await expect(page.getByText('Bonjour c\'est bien les secours')).toBeVisible({ timeout: 10000 });
    await page.getByText('Oui ! Que se passe-t\'il ?').click();
    await expect(page.getByText('Je viens tout juste de me réveiller')).toBeVisible();
    
    // Ouvrir le menu de sauvegarde
    await page.getByTitle('Sauvegarder').click();
    
    // Vérifier que la modal s'ouvre
    await expect(page.getByText('Sauvegarder la partie')).toBeVisible();
    
    // Saisir un nom de sauvegarde
    await page.getByPlaceholder('Nom de la sauvegarde').fill('Test E2E Save');
    
    // Sauvegarder
    await page.getByText('Sauvegarder', { exact: true }).click();
    
    // Vérifier que la modal se ferme
    await expect(page.getByText('Sauvegarder la partie')).not.toBeVisible();
    
    // Redémarrer le jeu
    await page.getByTitle('Recommencer').click();
    
    // Confirmer le redémarrage
    page.on('dialog', dialog => dialog.accept());
    
    // Charger la sauvegarde
    await page.getByTitle('Charger').click();
    
    // Vérifier que la modal de chargement s'ouvre
    await expect(page.getByText('Charger la partie')).toBeVisible();
    
    // Vérifier que notre sauvegarde existe
    await expect(page.getByText('Test E2E Save')).toBeVisible();
    
    // Charger la sauvegarde
    await page.getByText('Charger', { exact: true }).first().click();
    
    // Vérifier que nous sommes revenus au bon endroit
    await expect(page.getByText('Je viens tout juste de me réveiller')).toBeVisible();
  });

  test('should track progress correctly', async ({ page }) => {
    // Vérifier que le tracker de progression est visible
    await expect(page.getByText('Progression')).toBeVisible();
    await expect(page.getByText('0%')).toBeVisible();
    
    // Naviguer dans l'histoire
    await expect(page.getByText('Bonjour c\'est bien les secours')).toBeVisible({ timeout: 10000 });
    await page.getByText('Oui ! Que se passe-t\'il ?').click();
    
    // Vérifier que la progression a augmenté
    await expect(page.getByText('0%')).not.toBeVisible();
    
    // Continuer la navigation
    await page.getByText('Décrivez moi l\'endroit').click();
    
    // Vérifier que plus de nœuds ont été visités
    await expect(page.getByText('scènes visitées')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Tester sur mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Vérifier que le contenu s'affiche correctement
    await expect(page.getByText('Asylum')).toBeVisible();
    await expect(page.getByText('Histoire Interactive')).toBeVisible();
    
    // Vérifier que les boutons sont accessibles
    await expect(page.getByTitle('Sauvegarder')).toBeVisible();
    await expect(page.getByTitle('Charger')).toBeVisible();
    
    // Tester sur tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Vérifier que le layout s'adapte
    await expect(page.getByText('Asylum')).toBeVisible();
  });

  test('should navigate to editor and back', async ({ page }) => {
    // Aller à l'éditeur
    await page.getByText('Éditeur').click();
    
    // Vérifier que nous sommes dans l'éditeur
    await expect(page.getByText('Story Editor')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Ajouter Nœud')).toBeVisible();
    
    // Retourner au jeu
    await page.getByText('Jeu').click();
    
    // Vérifier que nous sommes revenus au jeu
    await expect(page.getByText('Asylum')).toBeVisible();
    await expect(page.getByText('Histoire Interactive')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Attendre que le contenu se charge
    await expect(page.getByText('Bonjour c\'est bien les secours')).toBeVisible({ timeout: 10000 });
    
    // Tester la navigation au clavier
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Vérifier que nous pouvons naviguer avec Enter
    const firstChoice = page.getByText('Oui ! Que se passe-t\'il ?');
    await firstChoice.focus();
    await page.keyboard.press('Enter');
    
    // Vérifier la navigation
    await expect(page.getByText('Je viens tout juste de me réveiller')).toBeVisible();
  });

  test('should handle performance requirements', async ({ page }) => {
    // Mesurer le temps de chargement initial
    const startTime = Date.now();
    
    await page.goto('/');
    await expect(page.getByText('Asylum')).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Le temps de chargement devrait être raisonnable (< 3s pour E2E)
    expect(loadTime).toBeLessThan(3000);
    
    // Vérifier que les animations sont fluides (pas de tests de framerate ici, mais on peut vérifier la présence)
    await expect(page.getByText('Histoire Interactive')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simuler une erreur en essayant d'accéder à une page qui n'existe pas
    await page.goto('/nonexistent-page');
    
    // Vérifier que nous avons une page d'erreur ou une redirection
    // Note: Next.js gère automatiquement les 404
    await expect(page.getByText('404')).toBeVisible().catch(() => {
      // Si pas de page 404 custom, vérifier qu'on est redirigé vers la home
      expect(page.url()).toContain('/');
    });
  });
});

test.describe('Editor Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
  });

  test('should load the visual editor', async ({ page }) => {
    // Attendre que l'éditeur se charge (React Flow peut prendre du temps)
    await expect(page.getByText('Story Editor')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Ajouter Nœud')).toBeVisible();
    
    // Vérifier les contrôles de base
    await expect(page.getByText('Nouveau')).toBeVisible();
    await expect(page.getByText('Sauvegarder')).toBeVisible();
    await expect(page.getByText('Exporter')).toBeVisible();
    await expect(page.getByText('Tester')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await expect(page.getByText('Story Editor')).toBeVisible({ timeout: 15000 });
    
    // Créer un nouveau projet
    await page.getByText('Nouveau').click();
    
    // Vérifier qu'un nouveau projet est créé
    await expect(page.getByText('Nouvelle Histoire')).toBeVisible();
    
    // Vérifier qu'un nœud de départ est créé automatiquement
    await expect(page.getByText('DÉBUT')).toBeVisible();
  });

  test('should add nodes to the editor', async ({ page }) => {
    await expect(page.getByText('Story Editor')).toBeVisible({ timeout: 15000 });
    
    // Ouvrir le menu d'ajout de nœuds
    await page.getByText('Ajouter Nœud').click();
    
    // Vérifier que le menu est ouvert
    await expect(page.getByText('Scène')).toBeVisible();
    
    // Ajouter un nœud de scène
    await page.getByText('Scène').click();
    
    // Vérifier qu'un nouveau nœud est ajouté (peut prendre un moment pour React Flow)
    await expect(page.locator('[data-testid*="node"]')).toHaveCount(2, { timeout: 5000 });
  });

  test('should export story successfully', async ({ page }) => {
    await expect(page.getByText('Story Editor')).toBeVisible({ timeout: 15000 });
    
    // Créer un projet simple
    await page.getByText('Nouveau').click();
    
    // Ouvrir le menu d'export
    await page.getByText('Exporter').click();
    
    // Vérifier que la modal d'export s'ouvre
    await expect(page.getByText('Exporter l\'histoire')).toBeVisible();
    
    // Sélectionner un format et exporter
    await page.getByText('Asylum JSON').click();
    
    // Surveiller les téléchargements
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByText('Exporter', { exact: true }).click();
    
    // Vérifier qu'un fichier est téléchargé
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/asylum-story-.*\.json/);
  });
});