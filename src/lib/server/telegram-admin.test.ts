// @ts-nocheck
import { afterEach, describe, expect, test } from "bun:test";
import { isTelegramAdmin } from "./telegram";

afterEach(() => delete process.env.ADMIN_TELEGRAM_IDS);

describe("Telegram administrators", () => {
	test("matches complete IDs from a comma-separated environment value", () => {
		process.env.ADMIN_TELEGRAM_IDS = "123, 456";
		expect(isTelegramAdmin("123")).toBe(true);
		expect(isTelegramAdmin("23")).toBe(false);
	});

	test("grants nobody access when the variable is empty", () => {
		process.env.ADMIN_TELEGRAM_IDS = "";
		expect(isTelegramAdmin("123")).toBe(false);
	});
});
