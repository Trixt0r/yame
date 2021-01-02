import { FlexibleConnectedPositionStrategyOrigin } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { Tool } from '../../tool';

export class RegisterTool {
  static type = '[Toolbar] Register tool';
  constructor(public tool: Tool | Tool[]) { }
}

export class ActivateTool {
  static type = '[Toolbar] Activate tool';
  constructor(public tool: Tool | string, public event?: Event) { }
}

export class DeactivateTool {
  static type = '[Toolbar] Deactivate tool';
  constructor(public tool?: Tool | string, public event?: Event) { }
}

export class ShowToolbarOptions {
  static type = '[Toolbar] Show overlay';
  constructor(public component: ComponentType<unknown>, public origin?: FlexibleConnectedPositionStrategyOrigin) { }
}