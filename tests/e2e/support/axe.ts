import BaseAxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const settleAnimations = (page: Page) =>
  page.evaluate(async () => {
    const entranceLimit = 3000;
    const finite = document.getAnimations().filter((animation) => {
      const endTime = Number(animation.effect?.getComputedTiming().endTime ?? Infinity);
      return endTime <= entranceLimit;
    });
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  });

export default class AxeBuilder extends BaseAxeBuilder {
  private readonly scanned: Page;

  constructor(options: { page: Page }) {
    super(options);
    this.scanned = options.page;
  }

  override async analyze(): ReturnType<BaseAxeBuilder["analyze"]> {
    await expect(this.scanned).toHaveTitle(/.+/);
    await settleAnimations(this.scanned);
    return super.analyze();
  }
}
