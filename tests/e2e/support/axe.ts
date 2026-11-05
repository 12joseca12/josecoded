import BaseAxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export default class AxeBuilder extends BaseAxeBuilder {
  private readonly scanned: Page;

  constructor(options: { page: Page }) {
    super(options);
    this.scanned = options.page;
  }

  override async analyze(): ReturnType<BaseAxeBuilder["analyze"]> {
    await expect(this.scanned).toHaveTitle(/.+/);
    return super.analyze();
  }
}
