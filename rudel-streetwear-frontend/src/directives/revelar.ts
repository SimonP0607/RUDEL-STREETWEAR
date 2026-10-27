import type { Directive } from 'vue'

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const vRevelar: Directive<HTMLElement, number | undefined> = {
  mounted(el, { value }) {
    if (sinMovimiento() || typeof IntersectionObserver === 'undefined') return
    el.style.opacity = '0'
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return
        observador.disconnect()
        el.animate(
          [
            { opacity: 0, translate: '0 32px' },
            { opacity: 1, translate: '0 0' },
          ],
          { duration: 700, delay: value ?? 0, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' },
        )
        el.style.opacity = ''
      },
      { threshold: 0.12 },
    )
    observador.observe(el)
  },
}
