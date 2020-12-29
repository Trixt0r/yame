import { Tool } from '../../tool';

export class RegisterTool {
  static type = '[Toolbar] Register tool';

  constructor(public tool: Tool | Tool[]) { }
}

export class ActivateTool {
  static type = '[Toolbar] Activate tool';

  constructor(public tool: Tool | string) { }
}

export class DeactivateTool {
  static type = '[Toolbar] Deactivate tool';

  constructor(public tool?: Tool | string) { }
}