import { Asset } from '../../../../../../common/asset';

/**
 * Definition of an option click handler.
 *
 * @interface MenuOptionClickHandler
 */
interface MenuOptionClickHandler {

  /**
   * @param {MouseEvent} event The mouse event which got triggered by the browser.
   * @param {Asset} asset The asset to handle.
   */
  (event: MouseEvent, asset: Asset): void

}

/**
 * Definition of a menu option.
 *
 * @interface MenuOption
 */
export interface MenuOption {

  /** @type {string} Optional icon for the button. */
  icon?: string;

  /** @type {string} The option title, i.e. the name of the button. */
  title: string;

  /** @type {MenuOptionClickHandler} Callback to be called on click */
  callback: MenuOptionClickHandler;
}
