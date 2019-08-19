import { css, html, LitElement } from 'lit-element/lit-element.js';
import ResizeObserver from 'resize-observer-polyfill';
import { RtlMixin } from '../../mixins/rtl-mixin.js';

const ro = new ResizeObserver(entries => {
	entries.forEach(entry => entry.target.resizedCallback(entry.contentRect));
});

class ListItem extends RtlMixin(LitElement) {
	static get properties() {
		return {
			_breakpoint: { type: Number }
		};
	}

	static get styles() {
		const layout = css`
			.d2l-list-item-flex {
				display: flex;
			}
			.d2l-list-item-content {
				position: relative;
				width: 100%;
			}
			.d2l-list-item-content-flex {
				display: flex;
				flex-grow: 1;
				justify-content: stretch;
				margin: 18px 0;
				padding: var(--d2l-list-item-content-padding, 0);
			}
			::slotted([slot|="illustration"]){
				align-self: flex-start;
				display: flex;
				flex-grow: 0;
				flex-shrink: 0;
				margin-right: 0.9rem;
				max-height: 52px;
				max-width: 90px;
				overflow:hidden;
			}
			:host([dir="rtl"]) ::slotted([slot|="illustration"]) {
				margin-left: 0.9rem;
				margin-right: 0rem;
			}
			::slotted([slot="illustration-outer"]) {
				margin-bottom: 18px;
				margin-top: 18px;
			}
			::slotted([slot="actions"]) {
				align-self: flex-start;
				display: flex;
				flex-grow: 0;
			}
			.d2l-list-item-main {
				width: 100%;
			}
		`;
		const mainContent = css`
			::slotted(.d2l-list-item-text) {
				margin: 0;
				max-height: 2.4rem;
				overflow: hidden;
			}
			::slotted(.d2l-list-item-text-secondary-responsive),
			::slotted(.d2l-list-item-text-secondary) {
				margin: 0;
				margin-top: 0.3rem;
				overflow: hidden;
			}
			::slotted(.d2l-list-item-text-secondary-responsive) {
				display: none;
			}
		`;
		const divider = css`
			.d2l-list-item-divider-top,
			.d2l-list-item-divider-bottom {
				border: 0;
				border-top: 1px solid var(--d2l-color-mica);
				margin: 0;
				position: absolute;
				width: 100%;
			}
			.d2l-list-item-divider-top {
				display: var(--d2l-list-item-divider-top, none);
				top: -1px;
			}
			.d2l-list-item-divider-bottom {
				bottom: -1px;
				display: var(--d2l-list-item-divider-bottom, none);
			}
		`;

		const breakPoint580 = css`
			.d2l-list-item-flex[breakpoint="580"] ::slotted([slot|="illustration"]) {
				margin-right: 1rem;
				max-height: 71px;
				max-width: 120px;
			}
			:host([dir="rtl"]) .d2l-list-item-flex[breakpoint="580"] ::slotted([slot|="illustration"]) {
				margin-left: 1rem;
				margin-right: 0;
			}
			.d2l-list-item-flex[breakpoint="580"] ::slotted(.d2l-list-item-text-secondary-responsive) {
				display: block;
			}
		`;

		const breakPoint636 = css`
			.d2l-list-item-flex[breakpoint="636"] ::slotted([slot|="illustration"]) {
				margin-right: 1rem;
				max-height: 102px;
				max-width: 180px;
			}
			:host([dir="rtl"]) .d2l-list-item-flex[breakpoint="636"] ::slotted([slot|="illustration"]) {
				margin-left: 1rem;
				margin-right: 0;
			}
			.d2l-list-item-flex[breakpoint="636"] ::slotted(.d2l-list-item-text-secondary-responsive) {
				display: block;
			}
		`;

		const breakPoint842 = css`
			.d2l-list-item-flex[breakpoint="842"] ::slotted([slot|="illustration"]) {
				margin-right: 1rem;
				max-height: 120px;
				max-width: 216px;
			}
			:host([dir="rtl"]) .d2l-list-item-flex[breakpoint="842"] ::slotted([slot|="illustration"]) {
				margin-left: 1rem;
				margin-right: 0;
			}
			.d2l-list-item-flex[breakpoint="842"] ::slotted(.d2l-list-item-text-secondary-responsive) {
				display: block;
			}
		`;
		return [ layout, mainContent, divider, breakPoint580, breakPoint636, breakPoint842];
	}

	constructor() {
		super();
		this._breakpoint = 0;
		this._breakpointList = [842, 636, 580, 0];
	}

	render() {
		return html`
			<div class="d2l-list-item-flex" breakpoint="${this._breakpoint}">
				<slot name="illustration-outer"></slot>
				<div class="d2l-list-item-content">
					<hr class="d2l-list-item-divider-top"></hr>
					<div class="d2l-list-item-content-flex">
						<slot name="illustration"></slot>
						<div class="d2l-list-item-main"><slot></slot></div>
						<slot name="actions"></slot>
					</div>
					<hr class="d2l-list-item-divider-bottom"></hr>
				</div>
			</div>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		ro.observe(this);
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		ro.unobserve(this);
	}
	resizedCallback(rect) {
		const { width } = rect;
		this._breakpointList.some(breakpoint => {
			if (width >= breakpoint) {
				this._breakpoint = breakpoint;
				return true;
			}
		});
	}
}

customElements.define('d2l-list-item', ListItem);