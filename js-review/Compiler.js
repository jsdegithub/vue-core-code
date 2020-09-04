class Compiler {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        const fragment = this.node2Fragment(this.el);
        this.compile(fragment);
        this.el.appendChild(fragment);
    }

    isElementNode(node) {
        return node.nodeType === 1;
    }

    isTextNode(node) {
        return node.nodeType === 3;
    }

    node2Fragment(el) {
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment;
    }

    compile(fragment) {
        let childs = fragment.childNodes;
        childs.forEach(child => {
            if (this.isElementNode(child)) {
                this.compileElement(child);
            } else if (this.isTextNode(child)) {
                this.compileText(child);
            }
            if (child.childNodes.length > 0) {
                this.compile(child);
            }
        })
    }

    compileElement(node) {
        let attributes = node.attributes;
        [...attributes].forEach(attr => {
            let { name, value } = attr;
            let directive = name;
            if (this.isDirective(directive)) {
                let [_, temp] = directive.split('-');
                let [directiveType, eventType] = temp.split(':');
                compileUtil[directiveType](node, value, this.vm, eventType);
                node.removeAttribute('v-' + temp);
            } else if (this.isEvent(directive)) {
                let [_, eventType] = directive.split('@');
                compileUtil['on'](node, value, this.vm, eventType);
            }
        })
    }

    compileText(node) {
        let content = node.textContent;
        if (/\{\{(.+?)\}\}/g.test(content)) {
            compileUtil['text'](node, content, this.vm);
        }
    }

    isDirective(directive) {
        return directive.startsWith('v-');
    }

    isEvent(directive) {
        return directive.startsWith('@');
    }

}



const compileUtil = {

    html(node, attr, vm) {
        let value = this.getVal(attr, vm);
        this.updater.htmlUpdater(node, value);
    },

    text(node, attr, vm) {
        let value;
        let reg = /\{\{(.+?)\}\}/g;
        if (reg.test(attr)) {
            value = attr.replace(reg, (_, g) => {
                return this.getVal(g.trim(), vm);
            })
        } else {
            value = this.getVal(attr, vm);
        }
        this.updater.textUpdater(node, value);
    },

    model(node, attr, vm) {
        let value = this.getVal(attr, vm);
        this.updater.modelUpdater(node, value);
    },

    on(node, func, vm, eventType) {
        let fn = vm.$options.methods[func];
        node.addEventListener(eventType, fn.bind(vm), false);
    },

    getVal(attr, vm) {
        attr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, vm.$data)
    },

    updater: {

        modelUpdater(node, value) {
            node.value = value;
        },

        htmlUpdater(node, value) {
            node.innerHTML = value;
        },

        textUpdater(node, value) {
            node.textContent = value;
        }

    }

}