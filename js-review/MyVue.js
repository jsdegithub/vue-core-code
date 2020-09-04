class MyVue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data;
        this.$options = options;
        if (this.$el) {
            new Observer(this.$data);
            new Compiler(this.$el, this);
            this.Proxy(this, this.$data);
        }
    }
    Proxy(vm, data) {
        let keys = Object.keys(data);
        keys.forEach(key => {
            Object.defineProperty(vm, key, {
                get() {
                    return data[key];
                },
                set(newVal) {
                    data[key] = newVal;
                }
            })
        })
    }
}



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
        new Watcher(vm, attr, newVal => {
            this.updater.htmlUpdater(node, newVal);
        })
        this.updater.htmlUpdater(node, value);
    },

    text(node, attr, vm) {
        let value;
        let reg = /\{\{(.+?)\}\}/g;
        if (reg.test(attr)) {
            value = attr.replace(reg, (_, g) => {
                g = g.trim();
                new Watcher(vm, g, _ => {
                    //这里不能把attr替换成g，根据 textUpdater，假设替换目标为{{name}}--{{age}}的形式，
                    // 如果替换成g，将会导致替换后的文本只留name或age其一，另一部分将被覆盖。
                    // name和age两部分都要重新渲染。
                    this.updater.textUpdater(node, this.getContentVal(attr, vm));
                })
                return this.getVal(g, vm);
            })
        } else {
            value = this.getVal(attr, vm);
        }
        this.updater.textUpdater(node, value);
    },

    model(node, attr, vm) {
        let value = this.getVal(attr, vm);
        new Watcher(vm, attr, newVal => {
            this.updater.modelUpdater(node, newVal);
        })
        node.addEventListener('input', e => {
            this.setVal(attr, vm, e.target.value);
        })
        this.updater.modelUpdater(node, value);
    },

    on(node, func, vm, eventType) {
        let fn = vm.$options.methods[func];
        node.addEventListener(eventType, fn.bind(vm), false);
    },

    getVal(attr, vm) {
        return attr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, vm.$data);
    },

    setVal(attr, vm, inputVal) {
        attr.split('.').reduce((data, currentVal) => {
            data[currentVal] = inputVal;
        }, vm.$data);
    },

    getContentVal(attr, vm) {
        return attr.replace(/\{\{(.+?)\}\}/g, (_, g) => {
            return this.getVal(g.trim(), vm);
        })
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