/*
▓█████▄  ██▀███           ▒█████  
▒██▀ ██▌▓██ ▒ ██▒        ▒██▒  ██▒
░██   █▌▓██ ░▄█ ▒        ▒██░  ██▒
░▓█▄   ▌▒██▀▀█▄          ▒██   ██░
░▒████▓ ░██▓ ▒██▒ ██▓    ░ ████▓▒░
 ▒▒▓  ▒ ░ ▒▓ ░▒▓░ ▒▓▒    ░ ▒░▒░▒░ 
 ░ ▒  ▒   ░▒ ░ ▒░ ░▒       ░ ▒ ▒░ 
 ░ ░  ░   ░░   ░  ░      ░ ░ ░ ▒  
   ░       ░       ░         ░ ░  
 ░                 ░              
 */

 /**
  * @typedef {Object} Vec2
  * @property {Number} x
  * @property {Number} y
  */

/**
 * @param {*} value prepended value
 * @param {Array} array 
 * @returns {Array} new array with value prepended
 */
 export function prepend(value, array) {
    var newArray = array.slice();
    newArray.unshift(value);
    return newArray;
}

/**
 * Negate a vector
 * @param {Vec2} p 
 * @returns {Vec2}
 */
export function vNeg(p){ // Return -1*v
    return {x:-p.x, y:-p.y};
}
/**
 * Add two vectors
 * @param {Vec2} p1 
 * @param {Vec2} p2 
 * @returns {Vec2}
 */
export function vAdd(p1, p2){ // Return the sum, p1 + p2
    return {x:p1.x+p2.x, y:p1.y+p2.y };
}
/**
 * Subtract one vector from another
 * @param {Vec2} p1 
 * @param {Vec2} p2 
 * @returns {Vec2}
 */
export function vSub(p1, p2){// Return the difference, p1-p2
    return {x:p1.x-p2.x, y:p1.y-p2.y };
}
/**
 * Multiply a vector, p, with a number, v
 * @param {Vec2} p 
 * @param {Number} v 
 * @returns {Vec2}
 */
export function vMult(p,v){ // Multiply vector p with value v
    return {x:p.x*v, y: p.y*v};  
}
/**
 * The dot product of two vectors.
 * @param {Vec2} p1 
 * @param {Vec2} p2 
 * @returns {Number}
 */
export function vDot(p1, p2){ // Return the dot product of p1 and p2
    return p1.x*p2.x + p1.y*p2.y;
}
/**
 * The length of a vector, p
 * @param {Vec2} p 
 * @returns {Number}
 */
export function vLen(p){ // Return the length of the vector p
    return Math.sqrt(p.x**2 + p.y**2);
}
/**
 * Returns the normalized vector of p
 * @param {Vec2} p 
 * @returns {Vec2}
 */
export function vNorm(p){ // Normalize the vector p, p/||p||
    return vMult(p, 1.0/vLen(p));
}
/**
 * The angle matching the vector p
 * @param {Vec2} p 
 * @returns {Number}
 */
export function vAngle(p){ // The foundry compatible 'rotation angle' to point along the vector p
    return 90+Math.toDegrees(Math.atan2(p.y, p.x));
}
export function vRad(p){ // The foundry compatible 'rotation angle' to point along the vector p
    return Math.atan2(p.y, p.x);
  }
  


export class Vec2 {
    constructor(x, y) {
        this.x = x != null ? x : 0;
        this.y = y != null ? y : 0;
    }
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    setVec2(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    equals(v, tolerance) {
        if (tolerance == null) {
            tolerance = 0.0000001;
        }
        return (Math.abs(v.x - this.x) <= tolerance) && (Math.abs(v.y - this.y) <= tolerance);
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    added(v) {
        return Vec2.create( this.x + v.x, this.y + v.y);        
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    subbed(v) {
        return Vec2.create( this.x - v.x, this.y - v.y);        
    }
    scale(f) {
        this.x *= f;
        this.y *= f;
        return this;
    }
    scaled(f) {
        return Vec2.create( this.x * f, this.y * f );
    }
    distance(v) {
        var dx = v.x - this.x;
        var dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    squareDistance(v) {
        var dx = v.x - this.x;
        var dy = v.y - this.y;
        return dx * dx + dy * dy;
    }
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    clone() {
        return new Vec2(this.x, this.y);
    }
    dup(){
        return this.clone();
    }
    dot(b) {
        return this.x * b.x + this.y * b.y;
    }
    normalize() {
        var len = this.length();
        if (len > 0) {
            this.scale(1 / len);
        }
        return this;
    }
    static create(x, y) {
        return new Vec2(x, y);
    }
    static fromArray(a) {
        return new Vec2(a[0], a[1]);
    }
}


/**
 * 
 * @param {String} str String to test
 * @param {String} rule matching rule (e.g., something* )
 * @returns {Boolean}
 */
function matchRuleShort(str, rule) {
    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
  }


/**
 * @param {Array} arr1 Array to reorder
 * @param {Array} arr2 Array to sort, and used as indices for re-order array
 * @returns {Array} Array 1 sorted by array 2
 */
export const dsu = (arr1, arr2) => arr1
    .map((item, index) => [arr2[index], item]) // add the args to sort by
    .sort(([arg1], [arg2]) => arg2 - arg1) // sort by the args
    .map(([, item]) => item); // extract the sorted items

export const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1];
export const argMax = argFact((min, el) => (el[0] > min[0] ? el : min));
export const argMin = argFact((max, el) => (el[0] < max[0] ? el : max));

/**
 * @param {Set} setA 
 * @param {Set} setB 
 * @returns {Set} Union of set A and B
 */
export function setUnion(setA, setB) {
    const union = new Set(setA);
    for (const elem of setB) {
        union.add(elem);
    }
    return union;
}


/**
 * @param {Set} setA 
 * @param {Set} setB 
 * @returns {Set} Union of set A and B
 */
export function setDifference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}

/**
 * @param {Set} setA 
 * @param {Set} setB 
 * @returns {Set} Intersection of set A and B
 */
export function setIntersection(setA, setB) {
    let _intersection = new Set()
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return _intersection
}


// An implementation of hermite-like interpolation. The derivative is hermite-like, whereas the position is linearly interpolated
export class SimpleSpline{
    constructor(points, smoothness=0.0){
      this.p = points;
      this.smoothness = smoothness;
      this.lengths = [];
      for (let i = 1; i < this.len; ++i){
        this.lengths.push( vLen(vSub(this.p[i-1], this.p[i])) );
      }
    }
    parametricLength(){
      return this.lengths.reduce((p, a)=>p+a,0);
    }
    get len (){
      return this.p.length;
    }
    get plen(){
      return this.parametricLength();
    }
  
    // Position at parametric position t
    parametricPosition( t ){
      if (this.len<2){return this.p[0];}    
      let len = 0;
      for (let i = 1; i < this.len; ++i){
        let nlen = this.lengths[i-1];
        if (len+nlen >= t){
          let nfrac = (t-len)/(nlen);//normalized fraction
          // returning (1-nt)*prev + nt*cur
          return vAdd(vMult(this.p[i-1], 1-nfrac), vMult(this.p[i], nfrac) );
        }
        len += nlen;
      }
      // we have gone past our parametric length, clamp at last point
      return this.p[this.len-1];
    }
  
    #iNorm(i){
      if(i<1){
        return vNorm(vSub(this.p[0], this.p[1]));
      }
      if(i > (this.len-2)){
        // last (or past last) point, return (last - next to last)
        return vNorm(vSub(this.p[this.len-2], this.p[this.len-1]));
      }
      return vNorm( vSub(this.p[i-1], this.p[i+1]));
    }
  
    // Derivative at parametric position t
    derivative(t){
      if (t<=0){ 
        return this.#iNorm(0);
      }
      let len = 0;
      for (let i = 1; i < this.len; ++i){
        let nlen = this.lengths[i-1];
        if ((len+nlen) >= t){
          let nfrac = (t-len)/(nlen);//normalized fraction
          let p = this.#iNorm(i-1);
          let n = this.#iNorm(i);
          return vNorm( vAdd(vMult(p,1-nfrac), vMult(n,nfrac)) );
        }
        len += nlen;
      }
      return this.#iNorm(this.len);
    }
}
  