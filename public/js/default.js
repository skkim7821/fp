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

var generator = {
	count: 0,
	uniqueString: function(prefix) {
		return [prefix, this.count++].join(''); 
	}
};

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

function test(msg) {
	console.log(msg);
}

function test2(msg) {
  console.log(msg);
}

