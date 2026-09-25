/**
 * Syntax to make a generic compose method more readable (or more Ruby-like)
 *
 * Using to chain realm filtered methods like rails scopes
 *
 * @example
 *   scope(realm.objects('Project'), actives, test)
 */
export const scope = (realmResults, ...scopes) => compose(...scopes)(realmResults)

// Intro to compose: https://gist.github.com/JamieMason/172460a36a0eaef24233e6edb2706f83
export const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

export const pipe = (...fns) => compose.apply(compose, fns.reverse());
