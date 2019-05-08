"use strict";

const XmlBuilder = require("../../lib/xml/XmlBuilder");
const expect = require('chai').expect;

describe("XmlBuilder", () => {
    const xmlBuilder = new XmlBuilder();

    describe("build", () => {
        it("should create the XML", () => {
            const node = {
                name: 'root',
                attributes: {
                    foo: 1,
                    bar: `something'"<>&`
                },
                children: [
                    null,
                    undefined,
                    "foo",
                    {
                        toXml() {
                            return "XML";
                        }
                    },
                    {
                        name: 'child',
                        children: [
                            { name: 'A', attributes: {}, children: ["TEXT"] },
                            { name: 'B', attributes: { 'foo:bar': "value" } },
                            { name: 'C' }
                        ]
                    },
                    `bar'"<>&`
                ]
            };

            expect(xmlBuilder.build(node)).to.eq(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><root foo="1" bar="something'&quot;&lt;&gt;&amp;">fooXML<child><A>TEXT</A><B foo:bar="value"/><C/></child>bar'"&lt;&gt;&amp;</root>`);
        });

        it("should return undefined if root toXml yields nil", () => {
            const node = {
                toXml() {
                    return null;
                }
            };

            expect(xmlBuilder.build(node)).to.be.undefined;
        });
    });
});
