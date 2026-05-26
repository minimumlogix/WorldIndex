/* js/ui/SvgAnimator.js */
import { Device } from '../utils/Device.js';

export class SvgAnimator {
  /**
   * Binds mouse-parallax interactions to an SVG wrapper.
   * Respects system prefers-reduced-motion triggers.
   * @param {HTMLElement} wrapper - Container hosting the SVG
   * @param {number} [intensity=10] - Travel distance factor
   */
  static initParallax(wrapper, intensity = 10) {
    if (!wrapper || Device.prefersReducedMotion() || Device.isTouchDevice()) return;

    const svg = wrapper.querySelector('svg');
    if (!svg) return;

    // Set perspective on wrapper
    wrapper.style.perspective = '800px';
    svg.style.transition = 'transform 150ms ease-out';
    svg.style.transformStyle = 'preserve-3d';

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Map translations
      const transX = (x / rect.width) * intensity;
      const transY = (y / rect.height) * intensity;
      
      // Map rotation angles
      const rotateX = -(y / rect.height) * (intensity * 1.5);
      const rotateY = (x / rect.width) * (intensity * 1.5);

      svg.style.transform = `translate3d(${transX}px, ${transY}px, 20px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    wrapper.addEventListener('mouseleave', () => {
      svg.style.transition = 'transform var(--transition-slow)';
      svg.style.transform = 'translate3d(0, 0, 0) rotateX(0) rotateY(0)';
    });
  }

  /**
   * Triggers stroke drawing animation programmatically for SVG children.
   * @param {SVGElement} svg - Target SVG
   */
  static triggerDrawAnimation(svg) {
    if (!svg) return;

    const paths = svg.querySelectorAll('.draw-path, path, polygon, circle, line');
    paths.forEach((path, idx) => {
      let length = 0;
      try {
        length = path.getTotalLength ? path.getTotalLength() : 300;
      } catch (e) {
        length = 300;
      }

      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      
      // Trigger browser paint cycle reflow
      void path.getBoundingClientRect();

      path.style.transition = `stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 80}ms`;
      path.style.strokeDashoffset = '0';
    });
  }
}
export default SvgAnimator;
