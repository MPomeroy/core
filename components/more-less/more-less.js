import { ifDefined } from 'lit-html/directives/if-defined.js';
import ResizeObserver from 'resize-observer-polyfill/dist/ResizeObserver.es.js';
import { LitElement, html, css } from 'lit-element/lit-element.js';
import { getComposedChildren, isComposedAncestor } from '../helpers/d2l-dom.js';
import { LocalizeMixin } from '../localize/localize-mixin.js';
import '../button/button-subtle.js';
import 'd2l-icons/d2l-icon.js';
import 'd2l-icons/tier1-icons.js';
import 'fastdom/fastdom.js';

export class D2LMoreLess extends LocalizeMixin(LitElement)  {

	static get properties() {
		return {
			blurColor: { type: String, attribute: 'blur-color' }, // The gradient color of the blurring effect. Must be hex color code.
			expanded: { type: Boolean, reflect: true }, // Indicates whether element is in "more" state.
			hAlign: { type: String, attribute: 'h-align' }, // The h-align property of the more-less button.
			height: { type: String }, // The maximum height of the content when in "less" state.
			inactive: { type: Boolean, reflect: true }, // Whether the component is active or inactive.
			__langResources: { type: Object }
		};
	}

	static get styles() {
		return css`
			:host {
				display: block;
			}

			.more-less-content {
				overflow: hidden;
			}
			.more-less-transition {
				transition: height 400ms cubic-bezier(0, 0.7, 0.5, 1);
			}
			.more-less-blur {
				display: none;
			}
			:host(:not([expanded]):not([inactive])) .more-less-blur {
				display: block;
				content: "";
				position: relative;
				height: 1em;
				bottom: 1em;
				margin-bottom: -0.75em;
				background: linear-gradient(rgba(255, 255, 255, 0) 0%, rgb(255, 255, 255) 100%);
			}
			:host([inactive]) .more-less-toggle {
				display: none;
			}`;
	}

	constructor() {
		super();

		this.__langResources = {
			'ar': {
				more: 'المزيد',
				less: 'أقل'
			},
			'en': {
				more: 'more',
				less: 'less'
			},
			'es': {
				more: 'más',
				less: 'menos'
			},
			'fr': {
				more: 'plus',
				less: 'moins'
			},
			'ja': {
				more: 'より多い',
				less: 'より少ない'
			},
			'ko': {
				more: '더 보기',
				less: '축소'
			},
			'nl': {
				more: 'meer',
				less: 'minder'
			},
			'pt': {
				more: 'mais',
				less: 'menos'
			},
			'sv': {
				more: 'mer',
				less: 'mindre'
			},
			'tr': {
				more: 'diğer',
				less: 'daha az'
			},
			'zh': {
				more: '更多',
				less: '更少'
			},
			'zh-tw': {
				more: '較多',
				less: '較少'
			}
		};

		this.height = '4em';

		this.__baseHeight = 0;
		this.__resizeObserver = null;
		this.__content = null;
		this.__contentSlot = null;
		this.__autoExpanded = false;
		this.__shift = false;
		this.__transitionAdded = false;
		this.__bound_reactToChanges = null;
		this.__bound_reactToMutationChanges = null;
	}

	firstUpdated() {
		super.firstUpdated();

		this.__content = this.shadowRoot.querySelector('.more-less-content');
		this.__contentSlot = this.shadowRoot.querySelector('.more-less-content slot');
		if (this.__content.offsetParent !== null) {
			fastdom.mutate(this.__init_setBaseHeight, this);
		}
		fastdom.mutate(this.__init_setupBlurColour, this);
		this.__init_setupListeners();
	}

	disconnectedCallback() {
		super.disconnectedCallback();

		if (this.__resizeObserver) {
			this.__resizeObserver.disconnect();
			this.__resizeObserver = null;
		}
		if (this.__mutationObserver) {
			this.__mutationObserver.disconnect();
			this.__mutationObserver = null;
		}

		this.__content.removeEventListener('load', this.__bound_reactToChanges, true);
		this.__bound_reactToChanges = null;
		this.__bound_reactToMutationChanges = null;

		if (this.__contentSlot) {
			this.__contentSlot.removeEventListener('slotchange', this.__reactToChanges.bind(this));
			this.__contentSlot.removeEventListener('slotchange', this.__startObserving.bind(this));
		}
		this.__content.removeEventListener('focusin', this.__focusIn.bind(this));
		this.__content.removeEventListener('focusout', this.__focusOut.bind(this));
	}

	render() {
		return html`
			<div class="more-less-content"><slot></slot></div>
			<div class="more-less-blur"></div>
			<d2l-button-subtle
				class="more-less-toggle"
				icon="${this.__computeIcon()}"
				aria-hidden="true"
				@click="${this.__toggleOnClick}"
				text="${this.__computeText()}"
				h-align="${ifDefined(this.hAlign)}">
			</d2l-button-subtle>
		`;
	}

	getLanguage(langs) {
		for (var i = 0; i < langs.length; i++) {
			if (this.__langResources[langs[i]]) {
				return langs[i];
			}
		}

		return null;
	}

	async getLangResources(lang) {
		var proto = this.constructor.prototype;
		this.checkLocalizationCache(proto);

		var namespace = `more-less:${lang}`;

		if (proto.__localizationCache.requests[namespace]) {
			return proto.__localizationCache.requests[namespace];
		}

		var result = this.__langResources[lang];

		proto.__localizationCache.requests[namespace] = result;
		return result;
	}

	__init_setBaseHeight() {
		this.__content.style.height = this.height;
		fastdom.measure(this.__init_measureBaseHeight, this);
	}

	__init_measureBaseHeight() {
		this.__baseHeight = this.__content.offsetHeight;
		this.__adjustToContent();

		// react to images and whatnot loading
		this.__bound_reactToChanges = this.__bound_reactToChanges || this.__reactToChanges.bind(this);
		this.__content.addEventListener('load', this.__bound_reactToChanges, true);
	}

	__init_setupBlurColour() {
		if (!this.blurColor
			|| this.blurColor[0] !== '#'
			|| (this.blurColor.length !== 4 && this.blurColor.length !== 7)
		) {
			return;
		}

		var hex = this.blurColor.substring(1);

		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		if (hex.length === 3) {
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function(m, r, g, b) {
				return r + r + g + g + b + b;
			});
		}

		var bigint = parseInt(hex, 16);
		var r = (bigint >> 16) & 255;
		var g = (bigint >> 8) & 255;
		var b = bigint & 255;

		this.shadowRoot.querySelector('.more-less-blur').style.background =
			'linear-gradient(rgba(' + r + ',' + g + ',' + b + ',0) 0%, rgb(' + r + ',' + g + ',' + b + ') 100%)';
	}

	__init_setupListeners() {
		this.__startObserving();
		if (this.__contentSlot) {
			this.__contentSlot.addEventListener('slotchange', this.__reactToChanges.bind(this));
			this.__contentSlot.addEventListener('slotchange', this.__startObserving.bind(this));
		}
		this.__content.addEventListener('focusin', this.__focusIn.bind(this));
		this.__content.addEventListener('focusout', this.__focusOut.bind(this));
	}

	__computeText() {
		return this.localize(this.expanded ? 'less' : 'more');
	}

	__computeIcon() {
		return this.expanded ? 'd2l-tier1:chevron-up' : 'd2l-tier1:chevron-down';
	}

	__toggleOnClick() {
		if (this.expanded) {
			this.__shrink();
		} else {
			this.__expand();
		}

		this.__autoExpanded = false;
	}

	__shrink() {
		this.__addTransition();
		this.__content.style.height = this.height;
		this.expanded = false;
	}

	__expand() {
		this.__addTransition();
		this.__content.style.height = this.__content.scrollHeight + 'px';
		this.expanded = true;
	}

	__focusIn() {
		if (this.inactive || this.expanded) {
			return;
		}

		this.__expand();
		this.__autoExpanded = true;
	}

	__focusOut(e) {
		if (this.inactive
			|| !this.__autoExpanded
			|| isComposedAncestor(this.__content, e.relatedTarget)
		) {
			return;
		}

		this.__shrink();
		this.__autoExpanded = false;
	}

	__addTransition() {
		if (!this.__transitionAdded) {
			this.__content.classList.add('more-less-transition');
			this.__transitionAdded = true;
		}
	}

	__adjustToContent() {
		if (this.__baseHeight === 0) {
			fastdom.mutate(this.__init_setBaseHeight, this);
			return;
		}

		var contentHeight = this.__content.scrollHeight;
		var currentHeight = this.__content.offsetHeight;

		if (contentHeight <= this.__baseHeight) {
			if (!this.inactive) {
				fastdom.mutate(this.__adjustToContent_makeInactive, this);
			}
			return;
		}

		if (this.expanded && contentHeight !== currentHeight) {
			fastdom.mutate(this.__adjustToContent_resize.bind(this, contentHeight));
			return;
		}

		if (this.inactive) {
			fastdom.mutate(this.__adjustToContent_makeActive, this);
		}
	}

	__adjustToContent_makeInactive() {
		this.inactive = true;
		this.expanded = false;
		this.__content.style.height = null;
	}

	__adjustToContent_resize(contentHeight) {
		this.__content.style.height = contentHeight + 'px';
	}

	__adjustToContent_makeActive() {
		this.inactive = false;
		this.__content.style.height = this.height;
	}

	__reactToMutationChanges(mutations) {
		if (mutations
			&& Array.isArray(mutations)
			&& mutations.every(this.__isOwnMutation.bind(this))
		) {
			return;
		}

		this.__reactToChanges();
	}

	__reactToChanges() {
		if (!this.__transitionAdded) {
			fastdom.mutate(this.__reactToChanges_setupTransition, this);
		} else {
			fastdom.measure(this.__adjustToContent, this);
		}
	}

	__reactToChanges_setupTransition() {
		this.__addTransition();

		fastdom.measure(this.__adjustToContent, this);
	}

	__isOwnMutation(mutation) {
		return mutation.target === this.__content
			&& (mutation.type === 'style' || mutation.type === 'attributes');
	}

	__startObserving() {
		this.__bound_reactToChanges = this.__bound_reactToChanges || this.__reactToChanges.bind(this);
		this.__bound_reactToMutationChanges = this.__bound_reactToMutationChanges || this.__reactToMutationChanges.bind(this);
		this.__resizeObserver = this.__resizeObserver || new ResizeObserver(this.__bound_reactToChanges);
		this.__resizeObserver.disconnect();
		this.__mutationObserver = this.__mutationObserver || new MutationObserver(this.__bound_reactToMutationChanges);
		this.__mutationObserver.disconnect();

		if (this.__contentSlot) {
			var children = getComposedChildren(this.__contentSlot);
			for (var i = 0; i < children.length; ++i) {
				this.__resizeObserver.observe(children[i]);
				this.__mutationObserver.observe(children[i], {
					childList: true,
					subtree: true,
					characterData: true,
					attributes: true
				});
			}
		}
		this.__resizeObserver.observe(this.__content);
		this.__mutationObserver.observe(this.__content, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true
		});
	}

}

customElements.define('d2l-more-less', D2LMoreLess);
