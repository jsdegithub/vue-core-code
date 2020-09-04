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