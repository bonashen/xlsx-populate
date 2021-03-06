"use strict";

const { hash } = require('../xml/hash');
const HASH_LENGTH = 40;

/**
 * The shared strings table.
 * @ignore
 */
class SharedStrings {
    /**
     * Constructs a new instance of _SharedStrings.
     * @param {{}} node - The node.
     */
    constructor(node) {
        this._stringArray = [];

        /**
         * @type {Map<string, number>}
         * @private
         */
        this._hashMap = new Map();

        this._init(node);
        this._cacheExistingSharedStrings();
        this._node.children = [];
    }

    /**
     * Should be called before saving the workbook.
     */
    prepareSaving() {
        this._hashMap = new Map();
        this._node.children = [];
    }

    /**
     * Gets the index for a string
     * @param {number|string|Array.<{}>} stringOrRichText - The string or rich text array.
     * @returns {number} The index
     */
    async getIndexForString(stringOrRichText) {
        if (typeof stringOrRichText === 'number') stringOrRichText = `${stringOrRichText}`;

        // string that length smaller than 40 will not hash.
        const key = typeof stringOrRichText === 'string' && stringOrRichText.length <= HASH_LENGTH
            ? stringOrRichText : await hash(stringOrRichText);

        // If the string or rt is found in the cache, return the index.
        let index = this._hashMap.get(key);
        if (index >= 0) return index;

        // Otherwise, add it to the caches.
        index = this._node.children.length;
        this._hashMap.set(key, index);

        // Append a new si node.
        this._node.children.push({
            name: "si",
            children: Array.isArray(stringOrRichText) ? stringOrRichText : [
                {
                    name: "t",
                    attributes: (stringOrRichText.charAt(0) === ' ' || stringOrRichText.charAt(stringOrRichText.length - 1) === ' ')
                        ? { 'xml:space': "preserve" } : {},
                    children: [stringOrRichText]
                }
            ]
        });

        return index;
    }

    /**
     * Get the string for a given index
     * @param {number} index - The index
     * @returns {string|Array} The string
     */
    getStringByIndex(index) {
        return this._stringArray[index];
    }

    /**
     * Convert the collection to an XML object.
     * @returns {{}} The XML object.
     */
    toXml() {
        return this._node;
    }

    /**
     * Store any existing values in the caches.
     * @private
     * @returns {undefined}
     */
    _cacheExistingSharedStrings() {
        this._node.children.forEach((node, i) => {
            const content = node.children[0];
            if (content.name === "t") {
                const string = `${content.children[0]}`;
                this._stringArray.push(string);
            } else {
                this._stringArray.push(node.children);
            }
        });
    }

    /**
     * Initialize the node.
     * @param {{}} [node] - The shared strings node.
     * @private
     * @returns {undefined}
     */
    _init(node) {
        if (!node) node = {
            name: "sst",
            attributes: {
                xmlns: "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
            },
            children: []
        };

        this._node = node;

        delete this._node.attributes.count;
        delete this._node.attributes.uniqueCount;
    }
}

module.exports = SharedStrings;

/*
xl/sharedStrings.xml

<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="13" uniqueCount="4">
	<si>
		<t>Foo</t>
	</si>
	<si>
		<t>Bar</t>
	</si>
	<si>
		<t>Goo</t>
	</si>
	<si>
		<r>
			<t>s</t>
		</r><r>
			<rPr>
				<b/>
				<sz val="11"/>
				<color theme="1"/>
				<rFont val="Calibri"/>
				<family val="2"/>
				<scheme val="minor"/>
			</rPr><t>d;</t>
		</r><r>
			<rPr>
				<sz val="11"/>
				<color theme="1"/>
				<rFont val="Calibri"/>
				<family val="2"/>
				<scheme val="minor"/>
			</rPr><t>lfk;l</t>
		</r>
	</si>
</sst>
*/
