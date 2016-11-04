'use strict';

/* Dependencies. */
var unherit = require('unherit');

/* Expose. */
module.exports = patch;

/* Methods. */
var slice = [].slice;

/**
 * Clone `Ware` without affecting the super-class and
 * turn it into configurable middleware.
 *
 * @param {Function} Ware - Ware-like constructor.
 * @return {Function} AttachWare - Configurable middleware.
 */
function patch(Ware) {
  var AttachWare = unherit(Ware);
  var useFn = Ware.prototype.use;

  AttachWare.prototype.use = use;

  return function (fn) {
    return new AttachWare(fn);
  };

  /**
   * Attach configurable middleware.
   *
   * @memberof {AttachWare}
   * @this {AttachWare}
   * @param {Function} attach - Attacher.
   * @return {AttachWare} - `this`.
   */
  function use(attach) {
    var self = this;
    var params = slice.call(arguments, 1);
    var index;
    var length;
    var fn;

    /* Multiple attachers. */
    if ('length' in attach && typeof attach !== 'function') {
      index = -1;
      length = attach.length;

      /* So, `attach[0]` is a function, meaning its
       * either a list of `attachers` or its a `list`. */
      if (typeof attach[0] === 'function') {
        if (
          (attach[1] !== null && attach[1] !== undefined) &&
          typeof attach[1] !== 'function'
        ) {
          self.use.apply(self, attach);
        } else {
          while (++index < length) {
            self.use.apply(self, [attach[index]].concat(params));
          }
        }
      } else {
        while (++index < length) {
          self.use(attach[index]);
        }
      }

      return self;
    }

    /* Single attacher. */
    fn = attach.apply(null, [self.context || self].concat(params));

    /* Store the attacher to not break `new Ware(otherWare)`
     * functionality. */
    if (!self.attachers) {
      self.attachers = [];
    }

    self.attachers.push(attach);

    /* Pass `fn` to the original `Ware#use()`. */
    if (fn) {
      useFn.call(self, fn);
    }

    return self;
  }
}
