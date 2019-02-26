function jBarEffects(){
var MAX_LIFE = 50;
var jBar = document.querySelector('#jsearch-bar');
var canvas = document.querySelector('#jsearch-bar canvas');
var input = document.querySelector('#jsearch-bar input');
var jBar_input = document.querySelector('#jsearch-bar .jbar-input');
var field = {}
var hasFocus = false;
var caret = document.createElement('span');
caret.style.cssText = document.defaultView.getComputedStyle(input, '').cssText;
caret.style.position = 'absolute';
caret.style.left = 0;
caret.style.top = 0;
caret.style.width = 'auto';
caret.style.visibility = 'hidden';
jBar.appendChild(caret);

function reposition() {
    field = input.getBoundingClientRect();
    let temp = {};
    for(let i in field){
        temp[i] = field[i];
    }
    field = temp;
    field.top=23;
}
window.onload = reposition;
window.onresize = reposition;
reposition();

input.onfocus = function() {
	hasFocus = true
}
input.onblur = function() {
	hasFocus = false
}

function rain() {

}

function burst(intensity) {

	var behavior = [
		this.behavior.cohesion(),
		this.behavior.move()
	];

	var size = .75;
	``
	var force = .7;
	var lifeMin = 0;
	var progress = Math.min(field.width, caret.offsetWidth) / field.width;
	var offset = field.left + (field.width * progress);
	var rangeMin = Math.max(field.left, offset - 30);
	var rangeMax = Math.min(field.right, offset + 10);

	this.spray(intensity, function() {
		return [
			null, null,
			Vector.create(
				Random.between(rangeMin + 10, rangeMax - 20),
				Random.between(field.top + 15, field.bottom - 15)
			),
			Vector.random(force),
			size + Math.random(),
			Random.between(lifeMin, 0), behavior
		]
	});

	// top edge
	this.spray(intensity * .5, function() {
		return [
			null, null,
			Vector.create(
				Random.between(rangeMin, rangeMax),
				field.top
			),
			Vector.random(force),
			size + Math.random(),
			Random.between(lifeMin, 0), behavior
		]
	});

	// bottom edge
	this.spray(intensity * .5, function() {
		return [
			null, null,
			Vector.create(
				Random.between(rangeMin, rangeMax),
				field.top + field.height
			),
			Vector.random(force),
			size + Math.random(),
			Random.between(lifeMin, 0), behavior
		]
	});

	// left edge
	if (input.value.length === 1) {

		this.spray(intensity * 2, function() {
			return [
				null, null,
				Vector.create(
					field.left,
					Random.between(field.top, field.bottom)
				),
				Vector.random(force),
				size + Math.random(),
				Random.between(lifeMin, 0), behavior
			]
		});
	}

	// right edge
	if (rangeMax == field.right) {

		this.spray(intensity * 2, function() {
			return [
				null, null,
				Vector.create(
					field.right,
					Random.between(field.top, field.bottom)
				),
				Vector.random(force),
				size + Math.random(),
				Random.between(lifeMin, 0), behavior
			]
		});

	}

}

// start particle simulation
simulate(
	'2d', {
		init: function() {

		},
		tick: function(particles) {

			if (!particles) {
				return;
			}

			particles.forEach(function(p) {

				if (p.life > MAX_LIFE) {
					this.destroy(p);
				}

			});

		},
		beforePaint: function() {
			this.clear();
		},
		paint: function(particle) {

			var p = particle.position;
			var s = particle.size;
			var o = 1 - (particle.life / MAX_LIFE);

			this.paint.circle(p.x, p.y, s, 'rgba(255,255,255,' + o + ')');
			this.paint.circle(p.x, p.y, s + 2, 'rgba(231,244,255,' + (o * .25) + ')');

		},
		afterPaint: function() {
			// nothing
		},
		_keyup: function(x, y) {

			jBar_input.classList.add('keyup');
			setTimeout(function() {
				jBar_input.classList.remove('keyup')
			}, 100);

        },
        _input:function(){
            caret.textContent = input.value;

			burst.call(this, 5);
        }
	}
);

// "simulate" particle simulation logic
/**
 * Constants
 */
PI_2 = Math.PI / 2;
PI_180 = Math.PI / 180;

/**
 * Random
 */
var Random = {
	between: function(min, max) {
		return min + (Math.random() * (max - min));
	}
}

/**
 * 2D Vector Class
 */
function Vector(x, y) {
	this._x = x || 0;
	this._y = y || 0;
}

Vector.create = function(x, y) {
	return new Vector(x, y);
};

Vector.add = function(a, b) {
	return new Vector(a.x + b.x, a.y + b.y);
};

Vector.subtract = function(a, b) {
	return new Vector(a.x - b.x, a.y - b.y);
};

Vector.random = function(range) {
	var v = new Vector();
	v.randomize(range);
	return v;
};

Vector.distanceSquared = function(a, b) {
	var dx = a.x - b.x;
	var dy = a.y - b.y;
	return dx * dx + dy * dy;
};

Vector.distance = function(a, b) {
	var dx = a.x - b.x;
	var dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
};

Vector.prototype = {
	get x() {
		return this._x;
	},
	get y() {
		return this._y;
	},
	set x(value) {
		this._x = value;
	},
	set y(value) {
		this._y = value;
	},
	get magnitudeSquared() {
		return this._x * this._x + this._y * this._y;
	},
	get magnitude() {
		return Math.sqrt(this.magnitudeSquared);
	},
	get angle() {
		return Math.atan2(this._y, this._x) * 180 / Math.PI;
	},
	clone: function() {
		return new Vector(this._x, this._y);
	},
	add: function(v) {
		this._x += v.x;
		this._y += v.y;
	},
	subtract: function(v) {
		this._x -= v.x;
		this._y -= v.y;
	},
	multiply: function(value) {
		this._x *= value;
		this._y *= value;
	},
	divide: function(value) {
		this._x /= value;
		this._y /= value;
	},
	normalize: function() {
		var magnitude = this.magnitude;
		if (magnitude > 0) {
			this.divide(magnitude);
		}
	},
	limit: function(treshold) {
		if (this.magnitude > treshold) {
			this.normalize();
			this.multiply(treshold);
		}
	},
	randomize: function(amount) {
		amount = amount || 1;
		this._x = amount * 2 * (-.5 + Math.random());
		this._y = amount * 2 * (-.5 + Math.random());
	},
	rotate: function(degrees) {
		var magnitude = this.magnitude;
		var angle = ((Math.atan2(this._x, this._y) * PI_HALF) + degrees) * PI_180;
		this._x = magnitude * Math.cos(angle);
		this._y = magnitude * Math.sin(angle);
	},
	flip: function() {
		var temp = this._y;
		this._y = this._x;
		this._x = temp;
	},
	invert: function() {
		this._x = -this._x;
		this._y = -this._y;
	},
	toString: function() {
		return this._x + ', ' + this._y;
	}
}

/**
 * Particle Class
 */
function Particle(id, group, position, velocity, size, life, behavior) {

	this._id = id || 'default';
	this._group = group || 'default';

	this._position = position || new Vector();
	this._velocity = velocity || new Vector();
	this._size = size || 1;
	this._life = Math.round(life || 0);

	this._behavior = behavior || [];

}

Particle.prototype = {
	get id() {
		return this._id;
	},
	get group() {
		return this._group;
	},
	get life() {
		return this._life;
	},
	get size() {
		return this._size;
	},
	set size(size) {
		this._size = size;
	},
	get position() {
		return this._position;
	},
	get velocity() {
		return this._velocity;
	},
	update: function(stage) {

		this._life++;

		var i = 0;
		var l = this._behavior.length;

		for (; i < l; i++) {
			this._behavior[i].call(stage, this);
		}

	},
	toString: function() {
		return 'Particle(' + this._id + ') ' + this._life + ' pos: ' + this._position + ' vec: ' + this._velocity;
	}
}

// setup DOM
function simulate(dimensions, options) {

	// private vars
	var particles = [];
	var destroyed = [];
	var update = update || function() {};
	var stage = stage || function() {};
	var canvas;
	var context;

	if (!options) {
		console.error('"options" object must be defined');
		return;
	}

	if (!options.init) {
		console.error('"init" function must be defined');
		return;
	}

	if (!options.paint) {
		console.error('"paint" function must be defined');
		return;
	}

	if (!options.tick) {
		options.tick = function() {};
	}

	if (!options.beforePaint) {
		options.beforePaint = function() {};
	}

	if (!options.afterPaint) {
		options.afterPaint = function() {};
	}

	if (!options.action) {
		options.action = function() {};
	}

	if (document.readyState === 'interactive') {
		setup();
	} else {
		document.addEventListener('DOMContentLoaded', setup);
	}

	// resizes canvas to fit window dimensions
	function fitCanvas() {
		canvas.width = jBar.clientWidth;
		canvas.height = jBar.clientHeight;
	}

	// create canvas for drawing
	function setup() {

		// create
		canvas = document.createElement('canvas');
		jBar.appendChild(canvas);

		// correct canvas size on window resize
		window.addEventListener('resize', fitCanvas);

		// go
		go();
	}

	// canvas has been attached, let's go!
	function go() {

		// set initial canvas size
		fitCanvas();

		// get context for drawing
		context = canvas.getContext(dimensions);

		// simulation update loop
		function act() {

			// update particle states
			var i = 0;
			var l = particles.length;
			var p;
			for (; i < l; i++) {
				particles[i].update(this);
			}

			// clean destroyed particles
			while (p = destroyed.pop()) {

				do {

					// has not been found in destroyed array?
					if (p !== particles[i]) {
						continue;
					}

					// remove particle
					particles.splice(i, 1);

				} while (i-- >= 0)
			}

			// repaint context
			options.beforePaint.call(this);

			// repaint particles
			i = 0;
			l = particles.length;
			for (; i < l; i++) {
				options.paint.call(this, particles[i]);
			}

			// after particles have been painted
			options.afterPaint.call(this);
		}

		function tick() {

			// call update method, this allows for inserting particles later on
			options.tick.call(this, particles);

			// update particles here
			act();

			// on to the next frame
			window.requestAnimationFrame(tick);

		}

		/**
		 * API
		 **/
		function clear() {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}

		function destroy(particle) {
			destroyed.push(particle);
		}

		function add(id, group, position, velocity, size, life, behavior) {
			particles.push(new Particle(id, group, position, velocity, size, life, behavior));
		}

		function spray(amount, config) {
			var i = 0;
			for (; i < amount; i++) {
				add.apply(this, config());
			}
		}

		function debug(particle) {
			this.paint.circle(
				particle.position.x,
				particle.position.y,
				particle.size,
				'rgba(255,0,0,.75)'
			);
			context.beginPath();
			context.moveTo(particle.position.x, particle.position.y);
			context.lineTo(particle.position.x + (particle.velocity.x * 10), particle.position.y + (particle.velocity.y * 10));
			context.strokeStyle = 'rgba(255,0,0,.1)';
			context.stroke();
			context.closePath();
		};

		this.clear = clear;
		this.destroy = destroy;
		this.add = add;
		this.spray = spray;
		this.debug = debug;

		this.paint = {
			circle: function(x, y, size, color) {
				context.beginPath();
				context.arc(x, y, size, 0, 2 * Math.PI, false);
				context.fillStyle = color;
				context.fill();
			},
			square: function(x, y, size, color) {
				context.beginPath();
				context.rect(x - (size * .5), y - (size * .5), size, size);
				context.fillStyle = color;
				context.fill();
			}
		}

		this.behavior = {
			cohesion: function(range, speed) {
				range = Math.pow(range || 100, 2);
				speed = speed || .001;
				return function(particle) {

					var center = new Vector();
					var i = 0;
					var l = particles.length;
					var count = 0;

					if (l <= 1) {
						return;
					}

					for (; i < l; i++) {

						// don't use self in group
						if (particles[i] === particle || Vector.distanceSquared(particles[i].position, particle.position) > range) {
							continue;
						}

						center.add(Vector.subtract(particles[i].position, particle.position));
						count++;
					}

					if (count > 0) {

						center.divide(count);

						center.normalize();
						center.multiply(particle.velocity.magnitude);

						center.multiply(.05);
					}

					particle.velocity.add(center);

				}
			},
			separation: function(distance) {

				var distance = Math.pow(distance || 25, 2);

				return function(particle) {

					var heading = new Vector();
					var i = 0;
					var l = particles.length;
					var count = 0;
					var diff;

					if (l <= 1) {
						return;
					}

					for (; i < l; i++) {

						// don't use self in group
						if (particles[i] === particle || Vector.distanceSquared(particles[i].position, particle.position) > distance) {
							continue;
						}

						// stay away from neighbours
						diff = Vector.subtract(particle.position, particles[i].position);
						diff.normalize();

						heading.add(diff);
						count++;
					}

					if (count > 0) {

						// get average
						heading.divide(count);

						// make same length as current velocity (so particle won't speed up)
						heading.normalize();
						heading.multiply(particle.velocity.magnitude);

						// limit force to make particle movement smoother
						heading.limit(.1);
					}

					particle.velocity.add(heading);

				}
			},
			alignment: function(range) {
				range = Math.pow(range || 100, 2);
				return function(particle) {

					var i = 0;
					var l = particles.length;
					var count = 0;
					var heading = new Vector();

					if (l <= 1) {
						return;
					}

					for (; i < l; i++) {

						// don't use self in group also don't align when out of range
						if (particles[i] === particle || Vector.distanceSquared(particles[i].position, particle.position) > range) {
							continue;
						}

						heading.add(particles[i].velocity);
						count++;
					}

					if (count > 0) {

						heading.divide(count);
						heading.normalize();
						heading.multiply(particle.velocity.magnitude);

						// limit
						heading.multiply(.1);

					}

					particle.velocity.add(heading);

				}
			},
			move: function() {
				return function(particle) {
					particle.position.add(particle.velocity);

					// handle collisions?

				}
			},
			eat: function(food) {
				food = food || [];
				return function(particle) {

					var i = 0;
					var l = particles.length;
					var prey;

					for (; i < l; i++) {

						prey = particles[i];

						// can't eat itself, also, needs to be tasty
						if (prey === particle || food.indexOf(prey.group) === -1) {
							continue;
						}

						// calculate force vector
						if (Vector.distanceSquared(particle.position, neighbour.position) < 2 && particle.size >= neighbour.size) {
							particle.size += neighbour.size;
							destroy(neighbour);
						}

					}
				}
			},
			force: function(x, y) {
				return function(particle) {
					particle.velocity.x += x;
					particle.velocity.y += y;
				}
			},
			limit: function(treshold) {
				return function(particle) {
					particle.velocity.limit(treshold);
				}
			},
			attract: function(forceMultiplier, groups) {
				forceMultiplier = forceMultiplier || 1;
				groups = groups || [];
				return function(particle) {

					// attract other particles
					var totalForce = new Vector(0, 0);
					var force = new Vector(0, 0);
					var i = 0;
					var l = particles.length;
					var distance;
					var pull;
					var attractor;
					var grouping = groups.length;

					for (; i < l; i++) {

						attractor = particles[i];

						// can't be attracted by itself or mismatched groups
						if (attractor === particle || (grouping && groups.indexOf(attractor.group) === -1)) {
							continue;
						}

						// calculate force vector
						force.x = attractor.position.x - particle.position.x;
						force.y = attractor.position.y - particle.position.y;
						distance = force.magnitude;
						force.normalize();

						// the bigger the attractor the more force
						force.multiply(attractor.size / distance);

						totalForce.add(force);
					}

					totalForce.multiply(forceMultiplier);

					particle.velocity.add(totalForce);
				}
			},
			wrap: function(margin) {
				return function(particle) {

					// move around when particle reaches edge of screen
					var position = particle.position;
					var radius = particle.size * .5;

					if (position.x + radius > canvas.width + margin) {
						position.x = radius;
					}

					if (position.y + radius > canvas.height + margin) {
						position.y = radius;
					}

					if (position.x - radius < -margin) {
						position.x = canvas.width - radius;
					}

					if (position.y - radius < -margin) {
						position.y = canvas.height - radius;
					}

				}
			},
			reflect: function() {

				return function(particle) {

					// bounce from edges
					var position = particle.position;
					var velocity = particle.velocity;
					var radius = particle.size * .5;

					if (position.x + radius > canvas.width) {
						velocity.x = -velocity.x;
					}

					if (position.y + radius > canvas.height) {
						velocity.y = -velocity.y;
					}

					if (position.x - radius < 0) {
						velocity.x = -velocity.x;
					}

					if (position.y - radius < 0) {
						velocity.y = -velocity.y;
					}
				}

			},
			edge: function(action) {
				return function(particle) {

					var position = particle.position;
					var velocity = particle.velocity;
					var radius = particle.size * .5;

					if (position.x + radius > canvas.width) {
						action(particle);
					}

					if (position.y + radius > canvas.height) {
						action(particle);
					}

					if (position.x - radius < 0) {
						action(particle);
					}

					if (position.y - radius < 0) {
						action(particle);
					}
				}
			}
		}

		// public
		Object.defineProperties(this, {
			'particles': {
				get: function() {
					return particles;
				}
			},
			'width': {
				get: function() {
					return canvas.width;
				}
			},
			'height': {
				get: function() {
					return canvas.height;
				}
			},
			'context': {
				get: function() {
					return context;
				}
			}
		});

		// call init method so the scene can be setup
		options.init.call(this)

		// start ticking
		tick();

		// start listening to events
		var self = this;
		input.addEventListener('keyup', function(e) {
			options._keyup.call(self, e.pageX, e.pageY);
        });
        input.addEventListener('input', function(e) {
			options._input.call(self, e.pageX, e.pageY);
        });

	}

};

}