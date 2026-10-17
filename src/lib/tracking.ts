// Lightweight tracking layer that pushes events to the dataLayer (GTM),
// fbq (Facebook Pixel), and gtag (Google Analytics). All three are optional
// and only fire if the corresponding script is present on the page.

type DataLayerArgs = Record<string, unknown>;

function pushDataLayer(event: string, data: DataLayerArgs) {
  const w = window as unknown as { dataLayer?: unknown[] };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event, ecommerce: data });
  } else {
    w.dataLayer = [{ event, ecommerce: data }];
  }
}

function pushFbq(event: string, data?: DataLayerArgs) {
  const w = window as unknown as { fbq?: (...args: unknown[]) => void };
  if (typeof w.fbq === 'function') {
    w.fbq('track', event, data);
  }
}

function pushGtag(event: string, data?: DataLayerArgs) {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === 'function') {
    w.gtag('event', event, data);
  }
}

type ProductTracking = {
  id: string;
  name: string;
  price: number;
  currency?: string;
  quantity?: number;
  variant?: string;
  category?: string;
};

export function trackViewContent(product: ProductTracking) {
  const payload = {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: product.currency ?? 'BDT',
  };
  pushDataLayer('view_content', { items: [product] });
  pushFbq('ViewContent', payload);
  pushGtag('view_content', payload);
}

export function trackAddToCart(product: ProductTracking) {
  const payload = {
    content_ids: [product.id],
    content_name: product.name,
    value: product.price * (product.quantity ?? 1),
    currency: product.currency ?? 'BDT',
  };
  pushDataLayer('add_to_cart', { items: [product] });
  pushFbq('AddToCart', payload);
  pushGtag('add_to_cart', payload);
}

export function trackInitiateCheckout(items: ProductTracking[], value: number) {
  const payload = {
    content_ids: items.map((i) => i.id),
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
    value,
    currency: 'BDT',
  };
  pushDataLayer('initiate_checkout', { items, value });
  pushFbq('InitiateCheckout', payload);
  pushGtag('begin_checkout', payload);
}

export function trackPurchase(orderId: string, items: ProductTracking[], value: number) {
  const payload = {
    transaction_id: orderId,
    value,
    currency: 'BDT',
    items,
  };
  pushDataLayer('purchase', payload);
  pushFbq('Purchase', {
    content_ids: items.map((i) => i.id),
    value,
    currency: 'BDT',
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  });
  pushGtag('purchase', payload);
}
