describe('Comprehensive E2E Test Suite', () => {
  beforeEach(() => {
    cy.visit('/screens');
    cy.wait(2000); // Wait for initial data to load
  });

  it('should run complete user journey: screenshot, interaction, navigation', () => {
    // 1. Take a screenshot
    cy.get('button.screenshot-btn[title="Capture Screenshot"]').click();
    cy.wait(1000);

    // 2. Interact with hotspots
    cy.get('.hotspot[field="mst"]').click();
    cy.get('#ios-keyboard-container').type('123456789');
    cy.get('.ios-keyboard-container .preview-close').click();

    cy.get('.hotspot[field="password"]').click();
    cy.get('#ios-keyboard-container').type('123456');
    cy.get('.ios-keyboard-container .preview-close').click();

    // 3. Perform login
    cy.get('.hotspot[action="login"]').click();
    cy.get('.success-toast').should('be.visible');

    // 4. Navigate to another screen
    cy.wait(1000);
    cy.get('.hotspot[action="navigate"]').first().click();
    cy.wait(1000);

    // 5. Verify everything is working as expected
    cy.get('.screen-image').should('be.visible');
    cy.get('.hotspot').should('exist');
    cy.get('button.screenshot-btn').should('exist');
  });
});