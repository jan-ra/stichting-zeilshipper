import assert from 'node:assert/strict'
import { test } from 'node:test'

import { addSrcSets, srcSetOf, variantPath, variantWidthsFor } from '../scripts/lib/srcset.mjs'

test('only widths smaller than the original get a variant', () => {
  assert.deepEqual(variantWidthsFor(7743), [320, 640, 1280, 1920])
  assert.deepEqual(variantWidthsFor(1004), [320, 640])
  assert.deepEqual(variantWidthsFor(320), [])
})

test('variants are webp next to the original', () => {
  assert.equal(variantPath('/baked/4c06-sven-homepage.jpg', 640), '/baked/4c06-sven-homepage-640w.webp')
  assert.equal(variantPath('/baked/a.b-c.webp', 320), '/baked/a.b-c-320w.webp')
})

test('srcset lists candidates smallest first with their widths', () => {
  assert.equal(
    srcSetOf([{ path: '/baked/x.jpg', width: 2000 }, { path: '/baked/x-320w.webp', width: 320 }]),
    '/baked/x-320w.webp 320w, /baked/x.jpg 2000w'
  )
})

test('srcSet is added to image objects only, anywhere in the tree', () => {
  const sets = new Map([['/baked/x.jpg', 'S']])
  const doc = { a: { src: '/baked/x.jpg', alt: 'x' }, list: [{ photo: { src: '/baked/x.jpg' } }, { src: '/baked/y.jpg' }], url: '/baked/x.jpg' }
  assert.deepEqual(addSrcSets(doc, sets), {
    a: { src: '/baked/x.jpg', alt: 'x', srcSet: 'S' },
    list: [{ photo: { src: '/baked/x.jpg', srcSet: 'S' } }, { src: '/baked/y.jpg' }],
    url: '/baked/x.jpg',
  })
})
