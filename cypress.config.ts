import { defineConfig } from 'cypress';  
  
export default defineConfig({  
  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {  
      // implement node event listeners here  
      return config;  
    },  
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',  
    supportFile: 'cypress/support/e2e.ts',  
    fixturesFolder: 'cypress/fixtures',  
    screenshotsFolder: 'cypress/screenshots',  
    videosFolder: 'cypress/videos',  
    downloadsFolder: 'cypress/downloads',  
    viewportWidth: 375,  // iPhone SE width  
    viewportHeight: 667, // iPhone SE height  
    video: true,
    chromeWebSecurity: false,  
    defaultCommandTimeout: 10000,  
    pageLoadTimeout: 60000,  
    requestTimeout: 5000,  
    responseTimeout: 30000,  
  },  
});
