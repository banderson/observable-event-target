const EventTarget = require('event-target').default;
const Observable = require('any-observable');

const defaultOpts = {
  receiveError: false,
  passive: false,
  handler: null,
  once: false,
};

class ObservableEventTarget extends EventTarget {
  on(type, opts) {
    let { capture, once, receiveError, passive, handler } = Object.assign(
      {},
      defaultOpts,
      typeof opts === 'boolean' ? { capture: opts } : opts
    );

    return new Observable(observer => {
      const eventCallback = e => {
        try {
          if (typeof handler === 'function') {
            handler(e);
          }
          if (passive === true || !e.defaultPrevented) {
            observer.next(e);
          }
        } finally {
          if (once) {
            observer.complete();
          }
        }
      };

      const errorCallback = observer.error.bind(observer);

      this.addEventListener(type, eventCallback, opts);
      if (receiveError) {
        // bind was necessary here because jest was blowing up,
        // but it is also used in the reference implementation:
        // https://goo.gl/yNeFVu
        this.addEventListener('error', errorCallback);
      }

      return () => {
        this.removeEventListener(type, eventCallback);
        if (receiveError) {
          this.removeEventListener('error', errorCallback);
        }
      };
    });
  }
}

module.exports = ObservableEventTarget;
