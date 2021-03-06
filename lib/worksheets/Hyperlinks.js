"use strict";

const {
    decodeRowRange, decodeColRange, encodeColRange, encodeRowRange, isInColRange, isInRowRange
} = require('../formula/Utils');

/**
 * A class stores hyperlinks.
 */
class Hyperlinks {
    /**
     * @param {Sheet} sheet - The sheet.
     * @param {{}} hyperlinksNode - The hyperlinks node.
     */
    constructor(sheet, hyperlinksNode) {
        this._sheet = sheet;

        // helps faster query.
        this._data = new Map();
        this._position = { sheet: sheet.name() };
        this._addressCache = {};

        if (hyperlinksNode) {
            hyperlinksNode.children.forEach(hyperlinkNode => {
                this.set(hyperlinkNode.attributes.ref, hyperlinkNode);
            });
        }
    }

    /**
     * Parse a reference, i.e. D19, A1:C9, Sheet2!A1, A:C, 1:6...
     * @param {string} address - The reference string to parse.
     * @return {{sheet: string, row: number, col: number}} The reference object.
     */
    parse(address) {
        let ref = this._addressCache[address];
        if (!ref) {
            ref = this._sheet.workbook()._parser.parseReference(address, this._position.sheet);
            this._addressCache[address] = ref;
        }
        return ref;
    }

    /**
     * Retrieve a hyperlink node.
     * @param {string} refString - The reference string to parse.
     * @return {{}|undefined} A hyperlink node.
     */
    get(refString) {
        if (this._data.size === 0) return;
        const ref = this.parse(refString);
        let curr;
        this._data.forEach((refRow, rowRange) => {
            const row = decodeRowRange(rowRange);
            if (!(row.from <= ref.row && ref.row <= row.to))
                return;
            refRow.forEach((hyperlink, colRange) => {
                const col = decodeColRange(colRange);
                if (col.from <= ref.col && ref.col <= col.to) {
                    // prefer range reference
                    if (row.from !== row.to || col.from !== col.to || !curr)
                        curr = hyperlink;
                }
            });
        });
        return curr;
    }

    /**
     * Add hyperlink. If exists, replace it.
     * @param {string} refString - The reference string to add.
     * @param {{name, attributes, children}} hyperlink - The inner hyperlink node.
     * @return {undefined}
     */
    set(refString, hyperlink) {
        const addresses = refString.trim().split(' ');
        if (addresses.length > 1) {
            for (let i = 0; i < addresses.length; i++) {
                this.set(addresses[i], hyperlink);
            }
        } else {
            const ref = this.parse(refString);

            let rowRange, colRange;
            if (ref.from) {
                // ref is a range reference
                rowRange = encodeRowRange(ref.from.row, ref.to.row);
                colRange = encodeColRange(ref.from.col, ref.to.col);
            } else {
                // cell reference
                rowRange = encodeRowRange(ref.row, ref.row);
                colRange = encodeColRange(ref.col, ref.col);
            }

            // get row range
            let refRow = this._data.get(rowRange);
            if (!refRow) {
                refRow = new Map();
                this._data.set(rowRange, refRow);
            }
            refRow.set(colRange, hyperlink);
        }
    }

    /**
     * Remove a hyperlink.
     * @param {string} refString - The reference you want to remove.
     * @return {undefined}
     */
    delete(refString) {
        const ref = this.parse(refString);
        this._data.forEach((refRow, rowRange) => {
            if (!isInRowRange(rowRange, ref.row))
                return;
            refRow.forEach((hyperlink, colRange) => {
                if (!isInColRange(colRange, ref.col))
                    return;
                refRow.delete(colRange);
            });
            if (refRow.size === 0)
                this._data.delete(rowRange);
        });
    }

    forEach(fn) {
        this._data.forEach(refRow => {
            refRow.forEach(node => {
                fn(node);
            });
        });
    }

    /**
     * Return an xml form object.
     * @return {{}} Xml object.
     */
    toXml() {
        const node = {
            name: 'hyperlinks',
            attributes: {},
            children: []
        };
        this._data.forEach(refRow => {
            refRow.forEach(hyperlink => {
                if (hyperlink != null)
                    node.children.push(hyperlink);
            });
        });
        node.children = [...new Set(node.children)];
        return node;
    }
}

module.exports = Hyperlinks;
