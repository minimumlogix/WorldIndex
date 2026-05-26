/* js/ui/BotCard.js */
import { DOM } from '../utils/DOM.js';
import { lazyLoader } from './LazyLoader.js';
import { stateManager } from '../core/StateManager.js';
import { router } from '../core/Router.js';

export class BotCard {
  /**
   * Generates a fully interactive Bot Card DOM node.
   * @param {Object} bot - Bot details metadata
   * @returns {HTMLElement}
   */
  static render(bot) {
    const isFav = stateManager.isFavorite(bot.id);

    // Dynamic Favoriting indicator button
    const favoriteButton = DOM.el('button', {
      class: `btn btn-secondary bot-fav-btn ${isFav ? 'favorited' : ''}`,
      'aria-label': isFav ? `Remove ${bot.name} from bookmarks` : `Bookmark ${bot.name}`,
      style: { minWidth: '40px', padding: '10px 0' },
      onclick: (e) => {
        e.stopPropagation(); // Avoid card navigation
        stateManager.toggleFavorite(bot.id);
        const active = stateManager.isFavorite(bot.id);
        favoriteButton.innerHTML = active ? '❤️' : '🤍';
        favoriteButton.classList.toggle('favorited', active);
      }
    }, isFav ? '❤️' : '🤍');

    // Create tagged categories
    const tagElements = (bot.genres || []).map(genre => 
      DOM.el('span', { class: 'tag tag-accent' }, genre)
    );

    // Assemble bot card structures
    const cardElement = DOM.el('article', {
      class: 'bot-card gpu-accelerated',
      tabindex: '0',
      'aria-label': `View details of ${bot.name}`,
      onclick: () => {
        router.navigate(`/bot/${bot.id}`);
      },
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cardElement.click();
        }
      }
    },
      // 1. Illustration Background
      DOM.el('div', { class: 'card-image-layer' },
        DOM.el('img', {
          class: 'card-bg-image',
          'data-src': bot.cardImage,
          alt: `${bot.name} background design`
        })
      ),
      // 2. Circle Avatar
      DOM.el('div', { class: 'bot-avatar-container' },
        DOM.el('img', {
          class: 'bot-avatar-image',
          src: bot.avatar,
          alt: `${bot.name} profile avatar`
        })
      ),
      // 3. Ambient lighting overlay
      DOM.el('div', { class: 'card-gradient-overlay' }),
      // 4. Content Text
      DOM.el('h4', { style: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' } }, bot.name),
      DOM.el('p', { class: 'card-description', style: { marginBottom: '12px' } }, bot.description),
      DOM.el('div', { class: 'tags-list' }, ...tagElements),
      // 5. Actions drawer (reveals on hover)
      DOM.el('div', { class: 'bot-card-actions' },
        DOM.el('a', {
          href: bot.chatEndpoint || '#',
          class: 'btn btn-accent chat-link-action',
          target: '_blank',
          rel: 'noopener',
          style: { flexGrow: '1', fontSize: '0.85rem' },
          onclick: (e) => {
            e.stopPropagation();
            if (!bot.chatEndpoint) {
              e.preventDefault();
              alert('This agent is currently offline (chat endpoint not configured).');
            }
          }
        }, 'Chat'),
        DOM.el('button', {
          class: 'btn btn-secondary',
          style: { padding: '10px 14px', fontSize: '0.85rem' },
          onclick: (e) => {
            e.stopPropagation();
            router.navigate(`/bot/${bot.id}`);
          }
        }, 'Open'),
        favoriteButton
      )
    );

    // Register backdrop cover loader observer
    const bgImage = cardElement.querySelector('.card-bg-image');
    lazyLoader.observe(bgImage);

    return cardElement;
  }
}
export default BotCard;
