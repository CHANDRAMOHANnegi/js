class CustomPromise {
  #state = "pending";    // current state: "pending" | "fulfilled" | "rejected"
  #value = undefined;    // resolved value or rejection reason
  #handlers = [];        // queue of handlers waiting for state change

  /**
   * constructor(executor)
   * - Takes an executor function (resolve, reject) => {}
   * - Immediately calls it with bound resolve/reject.
   */
  constructor(executor) {
    const resolve = (val) => this.#update("fulfilled", val);
    const reject = (err) => this.#update("rejected", err);

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err); // errors inside executor = rejection
    }
  }

  /**
   * #update(state, value)
   * - Transitions the promise from pending → fulfilled/rejected.
   * - If value is another CustomPromise, adopts its state.
   */
  #update(state, value) {
    if (this.#state !== "pending") return; // ignore if already settled

    if (value instanceof CustomPromise) {
      // adopt inner promise
      value.then(
        (v) => this.#update("fulfilled", v),
        (e) => this.#update("rejected", e)
      );
      return;
    }

    this.#state = state;
    this.#value = value;
    this.#runHandlers();
  }

  /**
   * #runHandlers()
   * - Runs all queued handlers once promise is settled.
   * - Each handler is { onFulfilled, onRejected, resolve, reject }.
   * - Uses queueMicrotask to mimic async behavior of native Promise.
   */
  #runHandlers() {
    if (this.#state === "pending") return;

    queueMicrotask(() => {
      this.#handlers.forEach(({ onFulfilled, onRejected, resolve, reject }) => {
        try {
          if (this.#state === "fulfilled") {
            if (onFulfilled) {
              resolve(onFulfilled(this.#value)); // callback return → resolve chain
            } else {
              resolve(this.#value); // no callback → just forward value
            }
          } else if (this.#state === "rejected") {
            if (onRejected) {
              resolve(onRejected(this.#value)); // recovery → resolve chain
            } else {
              reject(this.#value); // no handler → forward rejection
            }
          }
        } catch (err) {
          reject(err); // exceptions = rejection
        }
      });
      this.#handlers = []; // clear after running
    });
  }

  /**
   * then(onFulfilled, onRejected)
   * - Adds callbacks to run when promise settles.
   * - Always returns a new CustomPromise (for chaining).
   */
  then(onFulfilled, onRejected) {
    return new CustomPromise((resolve, reject) => {
      this.#handlers.push({ onFulfilled, onRejected, resolve, reject });
      this.#runHandlers(); // in case already settled
    });
  }

  /**
   * catch(onRejected)
   * - Sugar for then(null, onRejected).
   * - Handles errors in the chain.
   */
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  /**
   * finally(callback)
   * - Runs callback regardless of fulfillment or rejection.
   * - Does not change the value/error, just passes it through.
   */
  finally(cb) {
    return this.then(
      (val) => {
        cb();
        return val;
      },
      (err) => {
        cb();
        throw err;
      }
    );
  }

  // --- Static Helpers (like native Promise) ---

  /**
   * CustomPromise.resolve(value)
   * - Creates a promise already fulfilled with given value.
   */
  static resolve(value) {
    return new CustomPromise((res) => res(value));
  }

  /**
   * CustomPromise.reject(reason)
   * - Creates a promise already rejected with given reason.
   */
  static reject(reason) {
    return new CustomPromise((_, rej) => rej(reason));
  }
}
