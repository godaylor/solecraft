/* global document, window */
;(function () {
  var preference = 'system'
  try {
    var saved = window.localStorage.getItem('solecraft:theme:v1')
    if (saved === 'light' || saved === 'dark') preference = saved
  } catch {
    // System appearance still works when browser storage is unavailable.
  }
  var dark =
    preference === 'dark' ||
    (preference === 'system' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  var color = document.querySelector('meta[name="theme-color"]')
  if (color) color.setAttribute('content', dark ? '#111a28' : '#f3f6fa')
})()
