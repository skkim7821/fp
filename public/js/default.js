function existy(x) { return x != null };
function truthy(x) { return (x !== false) && existy(x)};
function isEven(n) { return (n%2) === 0 }

function complement(PRED) { 
	return function() {
		return !PRED.apply(null, _.toArray(arguments)); 
	};
}

var isOdd = complement(isEven);

function doWhen(cond, action) { 
	if(truthy(cond))
		return action(); 
	else
		return undefined; 
}

function executeIfHasField(target, name) {
	return doWhen(existy(target[name]), function() {
		var result = _.result(target, name); 
		console.log(['The result is', result].join(' ')); 
		return result;
	});
}

function allOf(/* funs */) {
	return _.reduceRight(arguments, function(truth, f) {
		return truth && f(); 
	}, true);
}

function anyOf(/* funs */) {
	return _.reduceRight(arguments, function(truth, f) {
		return truth || f(); 
	}, false);
}

function cat() {
	var head = _.first(arguments); 
	if (existy(head))
		return head.concat.apply(head, _.rest(arguments)); 
	else
		return []; 
}

function construct(head, tail) { 
	return cat([head], _.toArray(tail));
}

function mapcat(fun, coll) {
	return cat.apply(null, _.map(coll, fun));
}

function butLast(coll) {
	return _.toArray(coll).slice(0, -1);
}

function interpose (inter, coll) { 
	return butLast(mapcat(function(e) {
		return construct(e, [inter]); 
	},
	coll)); 
}

function stringReverse(s) {
	if (!_.isString(s)) return undefined; 
	return s.split('').reverse().join("");
}

function dispatch(/* funs */) { 
	var funs = _.toArray(arguments); 
	var size = funs.length;
	
	return function(target /*, args */) { 
		var ret = undefined;
		var args = _.rest(arguments);
		
		for (var funIndex = 0; funIndex < size; funIndex++) { 
			var fun = funs[funIndex];
			ret = fun.apply(fun, construct(target, args));
			
			if (existy(ret)) return ret; 
		}
		return ret; 
	};
}

function isIndexed(data) {
	return _.isArray(data) || _.isString(data);
}

function nth(a, index) {
	if (!_.isNumber(index)) fail("Expected a number as the index"); 
	if (!isIndexed(a)) fail("Not supported on non-indexed type"); 
	if ((index < 0) || (index > a.length - 1))
		fail("Index value is out of bounds"); 
	
	return a[index];
}

function second(a) { 
	return nth(a, 1);
}

// sql like data function start

function project(table, keys) { 
	return _.map(table, function(obj) {
		return _.pick.apply(null, construct(obj, keys)); 
	});
};

function rename(obj, newNames) {
	return _.reduce(newNames, function(o, nu, old) {
		if (_.has(obj, old)) { 
			o[nu] = obj[old]; 
			return o;
		}
		else
			return o;
	},
	_.omit.apply(null, construct(obj, _.keys(newNames)))); 
};

function as(table, newNames) {
	return _.map(table, function(obj) {
		return rename(obj, newNames); 
	});
};

function restrict(table, pred) {
	return _.reduce(table, function(newTable, obj) {
		if (truthy(pred(obj))) 
			return newTable;
		else
			return _.without(newTable, obj);
	}, table); 
};

// sql like data function end

function plucker(FIELD) { 
	return function(obj) {
		return (obj && obj[FIELD]); 
	};
}

function finder(valueFun, bestFun, coll) {
	return _.reduce(coll, function(best, current) {
		var bestValue = valueFun(best);
		var currentValue = valueFun(current);
		
		return (bestValue === bestFun(bestValue, currentValue)) ? best : current; 
	});
}

function best(fun, coll) {
	return _.reduce(coll, function(x, y) {
		return fun(x, y) ? x : y 
	});
}

function repeat(times, VALUE) {
	return _.map(_.range(times), function() { return VALUE; });
}

function repeatedly(times, fun) { 
	return _.map(_.range(times), fun);
}

function iterateUntil(fun, check, init) { 
	var ret = [];
	var result = fun(init);
	
	while (check(result)) { 
		ret.push(result); 
		result = fun(result);
	}
	
	return ret; 
};

function always(VALUE) { 
	return function() {
		return VALUE; 
	};
};

function invoker (NAME, METHOD) {
	return function(target /* args ... */) {
		if (!existy(target)) fail("Must provide a target"); 
		
		var targetMethod = target[NAME];
		var args = _.rest(arguments);
		
		return doWhen((existy(targetMethod) && METHOD === targetMethod), function() { 
			return targetMethod.apply(target, args);
		}); 
	};
};

// function uniqueString(len) {
// 	return Math.random().toString(36).substr(2, len);
// };

function uniqueString(prefix) {
	return [prefix, new Date().getTime()].join('');
};

function makeUniqueStringFunction(start) { 
	var COUNTER = start;
	
	return function(prefix) {
		return [prefix, COUNTER++].join('');
	} 
};

// var generator = {
// 	count: 0,
// 	uniqueString: function(prefix) {
// 		return [prefix, this.count++].join('');
// 	}
// };

function div(x,y) { return x/y };

function fnull(fun /*, defaults */) { 
	var defaults = _.rest(arguments);
	
	return function(/* args */) {
		var args = _.map(arguments, function(e, i) {
			return existy(e) ? e : defaults[i]; 
		});
		
		return fun.apply(null, args); 
	};
};

function defaults(d) { 
	return function(o, k) {
		var val = fnull(_.identity, d[k]);
		return o && val(o[k]); 
	};
}

function checker(/* validators */) {
	var validators = _.toArray(arguments);
	
	return function(obj) {
		return _.reduce(validators, function(errs, check) {
			if (check(obj)) 
				return errs
			else
				return _.chain(errs).push(check.message).value();
		}, []); 
	};
}

function validator(message, fun) { 
	var f = function(/* args */) {
		return fun.apply(fun, arguments); 
	};
	
  f['message'] = message;
	return f; 
}

function aMap(obj) { 
	return _.isObject(obj);
}

function hasKeys() {
	var KEYS = _.toArray(arguments);
	
	var fun = function(obj) {
		return _.every(KEYS, function(k) {
			return _.has(obj, k); 
		});
	};
	
  fun.message = cat(["Must have values for keys:"], KEYS).join(" ");
	return fun; 
}

function curry(fun) { 
	return function(arg) {
		return fun(arg); 
	};
}

function curry2(fun) {
	return function(secondArg) {
		return function(firstArg) {
			return fun(firstArg, secondArg);
		}; 
	};
}

function curry3(fun) { 
	return function(last) {
		return function(middle) { 
			return function(first) {
				return fun(first, middle, last); 
			};
		}; 
	};
};

function partial(fun /*, pargs */) { 
	var pargs = _.rest(arguments);
	
	return function(/* arguments */) {
		var args = cat(pargs, _.toArray(arguments)); 
		return fun.apply(fun, args);
	}; 
}

function partial1(fun, arg1) { 
	return function(/* args */) {
		var args = construct(arg1, arguments);
		return fun.apply(fun, args); 
	};
}

function partial2(fun, arg1, arg2) { 
	return function(/* args */) {
		var args = cat([arg1, arg2], arguments);
		return fun.apply(fun, args); 
	};
}

function condition1(/* validators */) { 
	var validators = _.toArray(arguments);
	
	return function(fun, arg) {
		var errors = mapcat(function(isValid) {
			return isValid(arg) ? [] : [isValid.message]; 
		}, validators);
		
		if (!_.isEmpty(errors))
			throw new Error(errors.join(", "));
		
		return fun(arg); 
	};
}

var zero = validator("cannot be zero", function(n) { return 0 === n }); 
var number = validator("arg must be a number", _.isNumber);

function uncheckedSqr(n) { return n * n };

function myLength(ary) { 
	if (_.isEmpty(ary))
		return 0; 
	else
		return 1 + myLength(_.rest(ary)); 
}

function cycle(times, ary) { 
	if (times <= 0)
		return []; 
	else
		return cat(ary, cycle(times - 1, ary)); 
}

function constructPair(pair, rests) {
	return [ construct(_.first(pair), _.first(rests)), construct(second(pair), second(rests))];
}

function unzip(pairs) {
	if (_.isEmpty(pairs)) return [[],[]];
	
	return constructPair(_.first(pairs), unzip(_.rest(pairs)));
}


var influences = [
['Lisp', 'Smalltalk'], 
['Lisp', 'Scheme'], 
['Smalltalk', 'Self'], 
['Scheme', 'JavaScript'], 
['Scheme', 'Lua'],
['Self', 'Lua'],
['Self', 'JavaScript']];

function nexts(graph, node) {
	if (_.isEmpty(graph)) return [];
	
	var pair = _.first(graph); 
	var from = _.first(pair); 
	var to = second(pair); 
	var more = _.rest(graph);
	
	if (_.isEqual(node, from))
		return construct(to, nexts(more, node));
	else
		return nexts(more, node);
}

// var rev = invoker('reverse', Array.prototype.reverse);
var rev = dispatch(invoker('reverse', Array.prototype.reverse), stringReverse);


function depthSearch(graph, nodes, seen) { 
	
	if (_.isEmpty(nodes)) return rev(seen);
	
	var node = _.first(nodes); 
	var more = _.rest(nodes);
	
	if (_.contains(seen, node))
		return depthSearch(graph, more, seen);
	else
		return depthSearch(graph,
                           cat(nexts(graph, node), more),
                           construct(node, seen));
}

function tcLength(ary, n) {
	var l = n ? n : 0;
	
	if (_.isEmpty(ary)) 
		return l;
	else
		return tcLength(_.rest(ary), l + 1);
}

function andify(/* preds */) {
	var preds = _.toArray(arguments);

	return function(/* args */) {
		var args = _.toArray(arguments);
		var everything = function(ps, truth) { 
			if (_.isEmpty(ps))
				return truth; 
			else
				return _.every(args, _.first(ps)) && everything(_.rest(ps), truth);
		};
		
		return everything(preds, true); 
	};
}

function orify(/* preds */) {
	var preds = _.toArray(arguments);
	
	return function(/* args */) {
		var args = _.toArray(arguments);
		
		var something = function(ps, truth) { 
			if (_.isEmpty(ps))
				return truth; 
			else
				return _.some(args, _.first(ps)) || something(_.rest(ps), truth);
		};
		
		return something(preds, false); 
	};
}


function deepClone(obj) {
	if (!existy(obj) || !_.isObject(obj))
		return obj;
	
	var temp = new obj.constructor(); 
	for (var key in obj)
		if (obj.hasOwnProperty(key)) 
			temp[key] = deepClone(obj[key]);
	
	return temp; 
}

function visit(mapFun, resultFun, array) { 
	if (_.isArray(array))
		return resultFun(_.map(array, mapFun)); 
	else
		return resultFun(array); 
}

function postDepth(fun, ary) {
	return visit(partial1(postDepth, fun), fun, ary);
}

function preDepth(fun, ary) {
	return visit(partial1(preDepth, fun), fun, fun(ary));
}

function evenOline(n) { 
	if (n === 0)
		return true; 
	else
		return partial1(oddOline, Math.abs(n) - 1); 
}

function oddOline(n) { 
	if (n === 0)
		return false; 
	else
		return partial1(evenOline, Math.abs(n) - 1); 
}


function trampoline(fun /*, args */) {
	var result = fun.apply(fun, _.rest(arguments));
	
	while (_.isFunction(result)) { 
		result = result();
	}
	
	return result; 
}

function isEvenSafe(n) { 
	if (n === 0)
		return true; 
	else
		return trampoline(partial1(oddOline, Math.abs(n) - 1)); 
}

function isOddSafe(n) { 
	if (n === 0)
		return false; 
	else
		return trampoline(partial1(evenOline, Math.abs(n) - 1)); 
}

function generator(seed, current, step) { 
	return {
		head: current(seed), 
		tail: function() {
     console.log("forced");
		 return generator(step(seed), current, step); 
	 }
	}; 
}

function genHead(gen) { return gen.head }
function genTail(gen) { return gen.tail() }


function genTake(n, gen) {
	var doTake = function(x, g, ret) {
		if (x === 0) 
			return ret;
		else
			return partial(doTake, x-1, genTail(g), cat(ret, genHead(g)));
	};
		
	return trampoline(doTake, n, gen, []); 
}

var rand = partial1(_.random, 1);
function randString(len) {
	var ascii = repeatedly(len, partial1(rand, 26));
	return _.map(ascii, function(n) { 
		return n.toString(36);
  }).join('');
}


function generateRandomCharacter() { 
	return rand(26).toString(36);
}

function generateString(charGen, len) { 
	return repeatedly(len, charGen).join('');
}

var composedRandomString = partial1(generateString, generateRandomCharacter);


function skipTake(n, coll) { 
	var ret = [];
	var sz = _.size(coll);
	
	for(var index = 0; index < sz; index += n) { 
		ret.push(coll[index]);
	}
	return ret; 
}

function summ(array) { 
	var result = 0;
	var sz = array.length;
	
	for (var i = 0; i < sz; i++) 
		result += array[i];
	
	return result;
}

function summRec(array, seed) { 
	if (_.isEmpty(array))
		return seed; 
	else
		return summRec(_.rest(array), _.first(array) + seed); 
}

function deepFreeze(obj) { 
	if (!Object.isFrozen(obj))
  	Object.freeze(obj);
	
	for (var key in obj) {
		if (!obj.hasOwnProperty(key) || !_.isObject(obj[key]))
			continue; 
		
		deepFreeze(obj[key]);
	} 
}

function merge(/*args*/) {
	return _.extend.apply(null, construct({}, arguments));
}


function Queue(elems) { 
	this._q = elems;
}

Queue.prototype = {
	enqueue: function(thing) {
		return new Queue(this._q + thing); 
	}
};

var SaferQueue = function(elems) { 
	this._q = _.clone(elems);
}

SaferQueue.prototype = { 
	enqueue: function(thing) {
		return new SaferQueue(cat(this._q, [thing])); 
	}
};

function queue() {
	return new SaferQueue(_.toArray(arguments));
}

function Container(init) { 
	this._value = init;
};

Container.prototype = {
	update:function(fun /*, args */) {
		var args = _.rest(arguments); 
		var oldValue = this._value;
		
		this._value = fun.apply(this, construct(oldValue, args)); 
		
		return this._value;
	} 
};

function LazyChain(obj) { 
	this._calls = []; 
	this._target = obj;
}

LazyChain.prototype.invoke = function(methodName /*, args */) { 
	var args = _.rest(arguments);
	
	this._calls.push(function(target) { 
		var meth = target[methodName];
		
		return meth.apply(target, args); 
	});
	
	return this; 
};

LazyChain.prototype.force = function() {
	return _.reduce(this._calls, function(target, thunk) {
		return thunk(target); 
	}, this._target);
};

LazyChain.prototype.tap = function(fun) { 
	this._calls.push(function(target) {
		fun(target);
		return target; 
	});
	
	return this; 
}

function LazyChainChainChain(obj) {
	var isLC = (obj instanceof LazyChain);
	
	this._calls = isLC ? cat(obj._calls, []) : [];
	this._target = isLC ? obj._target : obj; 
}

// 195


function go() {
	var d = $.Deferred();
	
	$.when("")
		.then(function() {
			setTimeout(function() { 
				console.log("sub-task 1");
			}, 5000) 
		})
		.then(function() { 
			setTimeout(function() {
      	console.log("sub-task 2");
      }, 10000)
		}) 
		.then(function() {
			setTimeout(function() { 
				d.resolve("done done done done");
			}, 15000) 
		})
		
	return d.promise(); 
}

function pipeline(seed /*, args */) { 
	return _.reduce(_.rest(arguments),
										function(l,r) { return r(l); }, 
										seed);
};

