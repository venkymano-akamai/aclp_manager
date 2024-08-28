import { ui } from 'support/ui';
import { TimeUnit } from 'support/constants/TimeEnums';
import {
  mockAppendFeatureFlags,
  mockGetFeatureFlagClientstream,
} from 'support/intercepts/feature-flags';
import { makeFeatureFlagData } from 'support/util/feature-flags';
import 'cypress-wait-until';

export class Cloudpulse {
  navigateToCloudpulse() {
    mockAppendFeatureFlags({ aclp: makeFeatureFlagData(true) }).as(
      'getFeatureFlags'
    );
    mockGetFeatureFlagClientstream().as('getClientStream');
    cy.visitWithLogin('/monitor/cloudpulse', {
      onLoad: (contentWindow: any) => {
        if (contentWindow.document.readyState !== 'complete') {
          throw new Error('Page did not load completely');
        }
      },
      timeout: 5000,
    });
    cy.wait(['@getFeatureFlags', '@getClientStream']);
    cy.url().should('include', '/monitor/cloudpulse');
  }

  

  

  

 selectServiceName(serviceName: string) {
    ui.autocomplete.findByPlaceholderCustom('Select Dashboard').click().clear();
    ui.autocompletePopper.findByTitle(serviceName).should('be.visible').click();
  }

  selectRegion(region: string) {
    ui.regionSelect
      .find()
      .should('be.visible')
      .click()
      .type(region).click();
  }

  selectTimeRange(timeRange: any) {
    ui.autocomplete.findByTestId('cloudpulse-time-duration').click();
    ui.autocompletePopper.findByTitle(timeRange).click();
  }

  

  selectAndVerifyServiceName(service: string) {

    const resourceInput = cy.findByPlaceholderText('Select Resources');
    resourceInput.click()
     cy.get('li[role="option"]').each($el => {
      const itemText = $el.text().trim();
      const ariaSelected = $el.attr('aria-selected');
     if (itemText === service && ariaSelected === 'true') {
        cy.log(`${service} is already selected, no need to click.`);
       
      } else if (itemText === service && ariaSelected === 'false') {
        resourceInput.click().type(`${service}{enter}`);   
        expect(itemText).to.equal(service);
        }cy.get('body').click(0, 0);
       
    });
    
  }
  
  
  

  assertSelections(expectedOptions: any) {
    expect(cy.get(`[value*='${expectedOptions}']`), expectedOptions);
  }



  applyGlobalRefresh() {
    cy.get('[data-test-id="ReloadIcon"]', { timeout: 10000 })
      .should('exist')
      .should('be.visible')
      .then(($icon) => {
        cy.wrap($icon).scrollIntoView();
        cy.wrap($icon).click();
      });
  }

 

  checkAssertions = (
    requestPayload: any,
    aggregation: any,
    granularity: any,
    actualRelativeTimeDuration: any
  ) => {
    assert.equal(requestPayload['aggregate_function'], aggregation);
    expect(
      requestPayload['time_granularity'].value +
        requestPayload['time_granularity'].unit
    ).to.containIgnoreSpaces(granularity);
    expect(
      'Last' +
        requestPayload['relative_time_duration'].value +
        TimeUnit[requestPayload['relative_time_duration'].unit]
    ).to.containIgnoreSpaces(actualRelativeTimeDuration);
  };

  
  }
 

 

  

