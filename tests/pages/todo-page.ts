import { type Locator, type Page, expect } from "@playwright/test";

// Page Object Model for the TodoMVC app. Centralizes all selectors and
// interactions so tests stay declarative and isolated from selector changes.
export class TodoPage {
  // Locators are lazy — they describe how to find an element without querying
  // the DOM until an action or assertion is called on them.
  private readonly newTodoInput: Locator;
  private readonly todoItems: Locator;
  private readonly filters: {
    all: Locator;
    active: Locator;
    completed: Locator;
  };

  // `private readonly page: Page` in the parameter list is TypeScript shorthand
  // that declares and assigns the field in a single step.
  constructor(private readonly page: Page) {
    this.newTodoInput = page.getByPlaceholder("What needs to be done?");
    this.todoItems = page.getByTestId("todo-item");
    this.filters = {
      all: page.getByRole("link", { name: "All" }),
      active: page.getByRole("link", { name: "Active" }),
      completed: page.getByRole("link", { name: "Completed" }),
    };
  }

  async goto() {
    await this.page.goto("/todomvc");
  }

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press("Enter");
  }

  async addTodos(texts: string[]) {
    for (const text of texts) {
      await this.addTodo(text);
    }
  }

  async toggleTodo(index: number) {
    await this.todoItems.nth(index).getByRole("checkbox", { name: "Toggle Todo" }).check();
  }

  async deleteTodo(index: number) {
    const item = this.todoItems.nth(index);
    await item.hover(); // the delete button is CSS-hidden until the row is hovered
    await item.getByRole("button", { name: "Delete" }).click();
  }

  async filterBy(filter: "all" | "active" | "completed") {
    await this.filters[filter].click();
  }

  async getTodoTexts(): Promise<string[]> {
    return this.todoItems.getByTestId("todo-title").allTextContents();
  }

  async getVisibleCount(): Promise<number> {
    return this.todoItems.count();
  }

  async expectCompleted(index: number) {
    await expect(this.todoItems.nth(index)).toHaveClass(/completed/);
  }
}
