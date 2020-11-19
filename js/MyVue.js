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
        keys.forEach((key) => {
            Object.defineProperty(vm, key, {
                get() {
                    return data[key];
                },
                set(newVal) {
                    data[key] = newVal;
                },
            });
        });
    }
}

class Compiler {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        const fragment = this.node2Fragment(this.el);
        // console.log(this.el);
        // console.log(fragment);
        this.compile(fragment);
        this.el.appendChild(fragment);
        // console.log(this.el);
    }
    isElementNode(node) {
        return node.nodeType === 1;
    }
    isTextNode(node) {
        return node.nodeType === 3;
    }
    node2Fragment(el) {
        let f = document.createDocumentFragment();
        let firstChild;
        while ((firstChild = el.firstChild)) {
            f.appendChild(firstChild);
        }
        return f;
    }
    compile(fragment) {
        let childs = fragment.childNodes;
        childs.forEach((child) => {
            if (this.isElementNode(child)) {
                this.compileElement(child);
            } else if (this.isTextNode(child)) {
                this.compileText(child);
            }
            if (child.childNodes && child.childNodes.length > 0) {
                this.compile(child);
            }
        });
    }
    compileElement(node) {
        let attributes = node.attributes;
        [...attributes].forEach((attr) => {
            let { name, value } = attr;
            let directive = name;
            if (this.isDirective(directive)) {
                let [, temp] = directive.split("-");
                let [directiveType, eventType] = temp.split(":");
                compileUtil[directiveType](node, value, this.vm, eventType);
                node.removeAttribute("v-" + temp);
            } else if (this.isEvent(directive)) {
                let [, eventType] = directive.split("@");
                compileUtil["on"](node, value, this.vm, eventType);
            }
        });
    }
    compileText(node) {
        let content = node.textContent;
        if (/\{\{(.+?)\}\}/g.test(content)) {
            compileUtil["text"](node, content, this.vm);
        }
    }
    isDirective(attrName) {
        return attrName.startsWith("v-");
    }
    isEvent(attrName) {
        return attrName.startsWith("@");
    }
}

const compileUtil = {
    text(node, attr, vm) {
        let value;
        if (/\{\{(.+?)\}\}/g.test(attr)) {
            value = attr.replace(/\{\{(.+?)\}\}/g, (_, g) => {
                g = g.trim();
                new Watcher(vm, g, (_) => {
                    this.updater.textUpdater(node, this.getContentVal(attr, vm));
                    // this.updater.textUpdater(node, this.getval(g, vm));
                });
                return this.getval(g, vm);
            });
        } else {
            value = this.getval(attr, vm);
        }
        this.updater.textUpdater(node, value);
    },
    html(node, attr, vm) {
        let value = this.getval(attr, vm);
        new Watcher(vm, attr, (newVal) => {
            this.updater.htmlUpdater(node, newVal);
        });
        this.updater.htmlUpdater(node, value);
    },
    model(node, attr, vm) {
        let value = this.getval(attr, vm);
        new Watcher(vm, attr, (newVal) => {
            this.updater.modelUpdater(node, newVal);
        });
        node.addEventListener("input", (e) => {
            this.setVal(attr, vm, e.target.value);
        });
        this.updater.modelUpdater(node, value);
    },
    on(node, func, vm, eventType) {
        let fn = vm.$options.methods[func];
        node.addEventListener(eventType, fn.bind(vm), false);
    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value;
        },
        htmlUpdater(node, value) {
            node.innerHTML = value;
        },
        modelUpdater(node, value) {
            node.value = value;
        },
    },
    getval(attr, vm) {
        return attr.split(".").reduce((data, currentVal) => {
            return data[currentVal];
        }, vm.$data);
    },
    getContentVal(attr, vm) {
        return attr.replace(/\{\{(.+?)\}\}/g, (_, g) => {
            return this.getval(g.trim(), vm);
        });
    },
    setVal(attr, vm, inputVal) {
        if (attr.split(".").length >= 2) {
            var key = attr
                .split(".")
                .splice(0, length - 1)
                .reduce((obj, key) => {
                    return obj[key];
                }, vm.$data);
            key[attr.split(".")[attr.length - 1]] = inputVal;
        } else {
            vm.$data[attr] = inputVal;
        }
        // 以下是小马哥的代码，我认为有问题
        /* attr.split(".").reduce((data, currentVal) => {
            data[currentVal] = inputVal;
        }, vm.$data); */
    },
};
