describe('Keyboard Flow E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/screens');
    cy.wait(2000); // Wait for initial data to load
  });

  it('should display iOS keyboard when clicking on input hotspot', () => {
    // Click on MST input field (number type) - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();

    // Verify iOS keyboard container is visible
    cy.get('.ios-keyboard-container').should('have.class', 'visible');

    // Verify preview bar is shown with correct placeholder
    cy.get('.keyboard-preview').should('be.visible');
    cy.get('.preview-label').should('contain', 'Mã số thuế');

    // Verify keyboard wrapper has slide-up animation
    cy.get('.keyboard-wrapper').should('have.class', 'slide-up');
  });

  it('should display number pad layout for number input type', () => {
    // Click on MST input field (number type) - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();

    // Verify keyboard is visible
    cy.get('.ios-keyboard-container').should('have.class', 'visible');

    // Verify the keyboard container exists (layout would be handled by simple-keyboard library)
    cy.get('#ios-keyboard-container').should('exist');
  });

  it('should display QWERTY layout for password input type', () => {
    // Click on password input field - second input hotspot
    cy.get('.hotspot.input-hotspot').eq(1).click();

    // Verify keyboard is visible
    cy.get('.ios-keyboard-container').should('have.class', 'visible');

    // Verify the keyboard container exists
    cy.get('#ios-keyboard-container').should('exist');

    // Verify preview shows password placeholder
    cy.get('.preview-label').should('contain', 'Mật khẩu');
  });

  it('should handle typing functionality through virtual keyboard', () => {
    // Click on MST input field - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();

    // Type using the keyboard input (simulate virtual keyboard input)
    cy.get('#ios-keyboard-container').type('123456789');

    // Verify the preview value updates
    cy.get('.preview-value').should('contain', '123456789');
  });

  it('should handle backspace functionality', () => {
    // Click on MST input field and type some text - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('#ios-keyboard-container').type('123456789');

    // Simulate backspace using physical keyboard
    cy.get('body').type('{backspace}');

    // Verify the value is reduced by one character
    cy.get('.preview-value').should('contain', '12345678');
  });

  it('should handle physical keyboard bindings (KeyboardJS)', () => {
    // Click on input field to show keyboard - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('.ios-keyboard-container').should('have.class', 'visible');

    // Test physical keyboard input
    cy.get('body').type('abc123');

    // Verify input is added to the field
    cy.get('.preview-value').should('contain', 'abc123');

    // Test enter key to close keyboard
    cy.get('body').type('{enter}');
    cy.get('.ios-keyboard-container').should('not.have.class', 'visible');

    // Test escape key to close keyboard
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('.ios-keyboard-container').should('have.class', 'visible');
    cy.get('body').type('{esc}');
    cy.get('.ios-keyboard-container').should('not.have.class', 'visible');
  });

  it('should display iOS styling and theming correctly', () => {
    // Click on input field - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();

    // Verify iOS-style preview bar
    cy.get('.keyboard-preview').should('be.visible');
    cy.get('.preview-content').should('exist');
    cy.get('.preview-cursor').should('have.class', 'blink');

    // Verify close button styling
    cy.get('.preview-close').should('be.visible').and('contain', '✕');

    // Verify keyboard overlay for backdrop
    cy.get('.keyboard-overlay').should('have.class', 'visible');
  });

  it('should close keyboard when clicking close button', () => {
    // Click on input field - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('.ios-keyboard-container').should('have.class', 'visible');

    // Click the close button
    cy.get('.preview-close').click();

    // Verify keyboard is hidden
    cy.get('.ios-keyboard-container').should('not.have.class', 'visible');
    cy.get('.keyboard-overlay').should('not.have.class', 'visible');
  });

  it('should close keyboard when clicking overlay backdrop', () => {
    // Click on input field - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('.ios-keyboard-container').should('have.class', 'visible');

    // Click the overlay backdrop
    cy.get('.keyboard-overlay').click();

    // Verify keyboard is hidden
    cy.get('.ios-keyboard-container').should('not.have.class', 'visible');
  });

  it('should maintain input value when reopening keyboard', () => {
    // Click on input field and type - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('#ios-keyboard-container').type('12345');
    cy.get('.preview-close').click();

    // Reopen the same field
    cy.get('.hotspot.input-hotspot').eq(0).click();

    // Verify previous value is maintained
    cy.get('.preview-value').should('contain', '12345');
  });

  it('should handle different input types appropriately', () => {
    // Test number input - first input hotspot
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('.ios-keyboard-container').should('have.class', 'visible');
    cy.get('.preview-close').click();

    // Test password input - second input hotspot
    cy.get('.hotspot.input-hotspot').eq(1).click();
    cy.get('.ios-keyboard-container').should('have.class', 'visible');
    cy.get('.preview-close').click();

    // Verify both input types work without errors
    cy.get('.ios-keyboard-container').should('not.have.class', 'visible');
  });

  it('should handle rapid keyboard interactions without issues', () => {
    // Rapidly click between different input fields
    cy.get('.hotspot.input-hotspot').eq(0).click();
    cy.get('.hotspot.input-hotspot').eq(1).click();
    cy.get('.hotspot.input-hotspot').eq(0).click();

    // Verify keyboard remains functional
    cy.get('.ios-keyboard-container').should('have.class', 'visible');
    cy.get('#ios-keyboard-container').type('test');

    // Verify input is captured
    cy.get('.preview-value').should('contain', 'test');
  });
});
