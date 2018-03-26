const EventTarget = require('event-target').default;
const Observable = require('zen-observable');

class ObservableEventTarget extends EventTarget {
  on(type, opts = {}) {
    return new Observable(observer => {
      const eventCallback = e => {
        try {
          if (typeof opts.handler === 'function') {
            opts.handler(e);
          }
          if (opts.passive === true || !e.defaultPrevented) {
            observer.next(e);
          }
        } catch (err) {
          // ¯\_(ツ)_/¯
        } finally {
          if (opts.once) {
            observer.complete();
          }
        }
      };

      this.addEventListener(type, eventCallback);
      if (opts.receiveError) {
        // bind was necessary here because jest was blowing up,
        // but it is also used in the reference implementation:
        // https://goo.gl/yNeFVu
        this.addEventListener('error', observer.error.bind(observer));
      }

      return () => {
        this.removeEventListener(type, eventCallback);
        if (opts.receiveError) {
          this.removeEventListener('error');
        }
      };
    });
  }
}

module.exports = ObservableEventTarget;
