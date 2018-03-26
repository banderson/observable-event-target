const ObservableEventTarget = require('./index');
const EventTarget = require('event-target').default;
const Observable = require('any-observable');

const createEvent = (type, detail = {}) => {
  return new CustomEvent(type, { cancelable: true, detail });
};

const createSubscription = (observable, overrides = {}) => {
  const observer = {
    next: jest.fn(),
    ...overrides,
  };
  subscription = observable.subscribe(observer);

  return { subscription, observer };
};

it('implements minimal EventTarget/ObservableEventTarget interface', () => {
  class DummyTarget extends ObservableEventTarget {}
  const instance = new DummyTarget();

  expect(typeof instance.addEventListener).toBe('function');
  expect(typeof instance.removeEventListener).toBe('function');
  expect(typeof instance.on).toBe('function');
});

describe('#on', () => {
  let instance;
  let observable;
  let observer;
  let subscription;
  beforeEach(() => {
    instance = new ObservableEventTarget();
    observable = instance.on('something');

    // HACK workaround for JSDOM not suppporting extendable EventTarget
    // https://github.com/jsdom/jsdom/issues/2156#issuecomment-367965364
    const proxy = new Proxy(instance, {});
    proxy._document = window.document;
    // END HACK
  });

  it('returns an Observable', () => {
    expect(observable).toBeInstanceOf(Observable);
  });

  describe('when subscribed', () => {
    beforeEach(() => {
      ({ observer, subscription } = createSubscription(observable));
    });

    it('wires up event handler', () => {
      instance.dispatchEvent(createEvent('something'));

      expect(observer.next.mock.calls.length).toBe(1);
    });
  });

  describe('with opts.once', () => {
    beforeEach(() => {
      observable = instance.on('something', { once: true });
      ({ observer, subscription } = createSubscription(observable));
    });

    it('is completed after first dispatch', () => {
      instance.dispatchEvent(createEvent('something'));

      expect(subscription.closed).toBe(true);
    });

    it('completes even if exception is thrown in handler', () => {
      observable = instance.on('something', {
        handler: () => {
          throw new Error('sabotaged!');
        },
        once: true,
      });
      ({ observer, subscription } = createSubscription(observable));
      instance.dispatchEvent(createEvent('something'));

      expect(subscription.closed).toBe(true);
    });

    it('completes even if exception is thrown in next', () => {
      observable = instance.on('something', { once: true });
      ({ observer, subscription } = createSubscription(observable, {
        next: () => {
          throw new Error('blown up');
        },
      }));
      instance.dispatchEvent(createEvent('something'));

      expect(subscription.closed).toBe(true);
    });
  });

  describe('with opts.handler', () => {
    let handlerFn;
    beforeEach(() => {
      handlerFn = jest.fn();
      observable = instance.on('event-name', {
        handler: handlerFn,
      });
      ({ observer } = createSubscription(observable));
    });

    it('is invoked on event dispatches', () => {
      instance.dispatchEvent(createEvent('event-name'));

      expect(handlerFn).toBeCalled();
    });

    it('does not block observer.next call if it throws exception', () => {
      observable = instance.on('event-name', {
        handler: () => {
          throw new Error('sabotaged!');
        },
      });
      ({ observer } = createSubscription(observable));
      instance.dispatchEvent(createEvent('event-name'));

      expect(handlerFn.mock.calls.length).toBe(1);
    });

    it('is invoked before observer.next', () => {
      observable = instance.on('event-name', {
        handler: e => {
          e.detail.modified = true;
        },
      });
      ({ observer } = createSubscription(observable));
      instance.dispatchEvent(createEvent('event-name', { modified: false }));

      expect(observer.next.mock.calls.length).toBe(1);
      expect(observer.next.mock.calls[0][0].detail).toEqual({ modified: true });
    });

    it('can cancel observer.next call via preventDefault', () => {
      observable = instance.on('event-name', {
        handler: e => {
          e.preventDefault();
        },
      });
      ({ observer } = createSubscription(observable));
      instance.dispatchEvent(createEvent('event-name'));

      expect(observer.next.mock.calls.length).toBe(0);
    });
  });

  describe('with opts.receiveError', () => {
    beforeEach(() => {
      observable = instance.on('event-name', { receiveError: true });
      ({ observer, subscription } = createSubscription(observable, {
        error: jest.fn(),
      }));
    });

    it('invokes handler on error events', () => {
      instance.dispatchEvent(createEvent('error'));

      expect(observer.error.mock.calls.length).toBe(1);
    });

    it('unsubscribes after error is triggered', () => {
      instance.dispatchEvent(createEvent('error'));
      instance.dispatchEvent(createEvent('event-name'));

      expect(observer.error.mock.calls.length).toBe(1);
      expect(observer.next.mock.calls.length).toBe(0);
    });

    it('stops calling error handler after unsubscribe', () => {
      instance.dispatchEvent(createEvent('error'));
      subscription.unsubscribe();
      instance.dispatchEvent(createEvent('error'));

      expect(observer.error.mock.calls.length).toBe(1);
    });
  });

  describe('unsubscribe fn', () => {
    it('cleans up event handler', () => {
      instance.dispatchEvent(createEvent('something'));
      subscription.unsubscribe();
      instance.dispatchEvent(createEvent('something'));

      expect(observer.error.mock.calls.length).toBe(1);
    });
  });

  describe('with opts.passive === true', () => {
    it('will not cancel the event when the handler invokes preventDefault', () => {
      observable = instance.on('event-name', {
        passive: true,
        handler: e => {
          e.preventDefault();
        },
      });
      ({ observer } = createSubscription(observable));
      instance.dispatchEvent(createEvent('event-name'));

      expect(observer.next.mock.calls.length).toBe(1);
    });
  });
});
