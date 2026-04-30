import { test, expect } from "@playwright/test";
import { TodoPage } from "./pages/todo-page";

// Declared at module scope and assigned in beforeEach so all tests in the file
// share the same interface. The `!` tells TypeScript this will always be
// assigned before use, since beforeEach runs before every test.
let todoPage!: TodoPage;

test.beforeEach(async ({ page }) => {
  todoPage = new TodoPage(page);
  await todoPage.goto();
});

// ---------------------------------------------------------------------------
// 1. Core scenarios
// ---------------------------------------------------------------------------

test.describe("Adding a new todo", () => {
  test("should add a single todo and display it in the list", async () => {
    await todoPage.addTodo("Buy groceries");

    const items = await todoPage.getTodoTexts();
    expect(items).toEqual(["Buy groceries"]);
  });

  test("should append multiple todos in order", async () => {
    await todoPage.addTodos(["First", "Second", "Third"]);

    const items = await todoPage.getTodoTexts();
    expect(items).toEqual(["First", "Second", "Third"]);
  });
});

test.describe("Marking a todo as complete", () => {
  test("should visually mark the item as completed", async () => {
    await todoPage.addTodo("Finish report");
    await todoPage.toggleTodo(0);

    await todoPage.expectCompleted(0);
  });
});

test.describe("Deleting a todo", () => {
  test("should remove the item from the list", async () => {
    await todoPage.addTodos(["Renew passport", "Cancel free trial"]);
    await todoPage.deleteTodo(1);

    const items = await todoPage.getTodoTexts();
    expect(items).toEqual(["Renew passport"]);
  });
});

test.describe("Filtering todos", () => {
  // This beforeEach runs after the outer one, so each filtering test starts
  // with the page loaded and a known mix of active and completed items.
  test.beforeEach(async () => {
    await todoPage.addTodos(["Buy groceries", "Send invoice", "Book flight"]);
    await todoPage.toggleTodo(1); // marks "Send invoice" as complete
  });

  test("should show only active items when filtering by Active", async () => {
    await todoPage.filterBy("active");

    const items = await todoPage.getTodoTexts();
    expect(items).toEqual(["Buy groceries", "Book flight"]);
  });

  test("should show only completed items when filtering by Completed", async () => {
    await todoPage.filterBy("completed");

    const items = await todoPage.getTodoTexts();
    expect(items).toEqual(["Send invoice"]);
  });

  test("should show all items when switching back to All", async () => {
    await todoPage.filterBy("completed");
    await todoPage.filterBy("all");

    const items = await todoPage.getTodoTexts();
    expect(items).toEqual(["Buy groceries", "Send invoice", "Book flight"]);
  });
});

// ---------------------------------------------------------------------------
// 2. Edge case
// ---------------------------------------------------------------------------

/**
 * Edge Case: HTML/script injection
 *
 * The new-todo input accepts all text, including code. Can we inject anything that executes? 
 * A passing test here confirms the app escapes user content before rendering it.
 */
test.describe("Edge case – HTML injection", () => {
  test("should render HTML tags as literal text, not execute them", async ({ page }) => {
    // If injection succeeds, and test fails, the <img> is added as a DOM element an alert fires.
    // Note: Playwright may auto-dismiss an alert.
    // The HTML would be consumed, and getTodoTexts() would return a blank string.
    // We're passing in `page` in case we want to add a page.on('dialog') listener to assert that no alert is triggered.
    await todoPage.addTodo('<img src=x onerror="alert(1)">');

    const items = await todoPage.getTodoTexts();
    expect(items).toEqual(['<img src=x onerror="alert(1)">']);
  });
});

// Additional edge cases worth exploring with more time:
//
// Persistence on reload — add todos, call page.reload(), assert the list
//   survives. TodoMVC uses localStorage.
//
// Input boundary cases:
//   - Whitespace-only input (spaces) should be ignored rather than
//     creating a blank, invisible todo item.
//   - Very long input (e.g. 500+ characters) — no length constraint exists on
//     the field; worth verifying graceful rendering without layout breakage.
