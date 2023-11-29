const { test,expect } = require('@playwright/test');
const {
  VisualGridRunner,
  ClassicRunner,
  Eyes,
  Target,
  Configuration,
  BatchInfo,
  BrowserType,
  DeviceName,
  IosDeviceName,
  IosVersion,
  By
} = require('@applitools/eyes-playwright');

test.describe('NAB Chat Widget', () => {
      let eyes, runner;
      const isVisualGridRunner = true;

      test.beforeEach(async () => {
          // Create a runner with the specified test concurrency
          runner = isVisualGridRunner ? new VisualGridRunner({testConcurrency: 5}) : new ClassicRunner();

          eyes = new Eyes(runner);
          const configuration = new Configuration();
          configuration.setBatch(new BatchInfo('NAB Chat Widget'));

          if (isVisualGridRunner) {
              configuration.addBrowser(1440, 900, BrowserType.CHROME)
                  .addBrowser(1440, 900, BrowserType.FIREFOX)
                  .addBrowser(1440, 900, BrowserType.EDGE_CHROMIUM)
                  .addBrowser(1440, 900, BrowserType.SAFARI)
                  .addBrowser({
                      iosDeviceInfo: {
                          deviceName: IosDeviceName.iPhone_13,
                          iosVersion: IosVersion.ONE_VERSION_BACK
                      }
                  });
          }
          eyes.setConfiguration(configuration);
      });

    test('Chat Widget', async ({ page }) => {

        await page.goto('https://www.nab.com.au/help-support');

        await eyes.open(page, 'NAB Chat Widget', 'Chat Widget Validation');
        await page.waitForTimeout(10000);

        const frameContainer = await page.frameLocator('iframe#web-messenger-container');

        const FabButton = await frameContainer.locator('button#khorosWidgetButton');

        // Click Chat FAB Button
        FabButton.click();

        await page.waitForTimeout(20000);

        await eyes.check(
          'Welcome screen',
          Target.frame('iframe#web-messenger-container')
            .region('body #web-messenger-container')
        );

        // Selectors for User Actions
        const startChatButton = await frameContainer.getByRole('button', {
          name: 'Start conversation',
        });

        const loadingIndicator = await frameContainer.locator(
          '.khBusinessProfile + div span + span + span'
        );

        const chatInput = await frameContainer.getByRole('textbox', {
          name: 'Type a message...',
        });

        const sendMessageButton = await frameContainer.getByRole('button', {
          name: 'Send Button',
        });

        const messageList = await frameContainer.getByRole('list');
        const agentMessages = await messageList.locator('.khAgentMessageBubble');

        const agentTypingIndicator = await messageList.locator(
            '> div span + span + span'
        );

        await startChatButton.click();

        await expect(loadingIndicator).toBeHidden();
        if (await agentTypingIndicator.isVisible({ timeout: 3000 })) {
             await expect(agentTypingIndicator).toBeVisible({ timeout: 15_000 });
             await expect(agentMessages.last()).toBeInViewport({
             timeout: 10_000,
         });
            await expect(agentTypingIndicator).toBeHidden({ timeout: 15_000 });
        } else {
            await expect(agentMessages.last()).toBeInViewport({
            timeout: 10_000,
         });
        }

        await chatInput.fill("Test Chat");
        await sendMessageButton.click();
        await expect(agentTypingIndicator).toBeVisible({ timeout: 15_000 });
        await expect(agentTypingIndicator).toBeHidden({ timeout: 15_000 });

        await chatInput.fill("Test Chat Again");
        await sendMessageButton.click();

        await adjustIframeHeight(page, '100vh');

        await eyes.check(
              'Welcome screen',
              Target.region('iframe#web-messenger-container')
              // .region('khScrollArea')
                .fully()
                .ignoreRegions('.BusinessProfile__introductionText--Vr2lB.khBusinessProfileIntroText')
        );

        await eyes.close(false);
  });

  async function adjustIframeHeight(page, newHeight) {
    await page.evaluate((height) => {
        const iframe = document.getElementById('web-messenger-container');
        if (iframe) {
            iframe.style.height = height;
        }
    }, newHeight);
}

  test.afterEach(async () => {
    await eyes.abort();
    const results = await runner.getAllTestResults(false);
    console.log('Ultrafast Results', results);
  });
});