const support = !!(localStorage && localStorage.getItem);

const avaliable = (() => {
    try {
        localStorage.setItem('_t', '');
        return true;
    }
    catch (e) {
        return false;
    }
})();

function deserialize(str) {
    let result;

    try {
        result = JSON.parse(str);
    }
    catch (e) {
        result = null;
    }

    return result;
}

export function set(key, val) {
    if (!support || !avaliable) {
        return;
    }

    val = typeof val === 'string' ? val : JSON.stringify(val);

    try {
        localStorage.setItem(key, val);
    }
    catch (e) {

    }
}

export function get(key) {
    return !support || deserialize(localStorage.getItem(key));
}

export function remove(key) {
    !key ? localStorage.clear() : localStorage.removeItem(key);
}
