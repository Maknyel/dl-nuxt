<script setup lang="ts">
/**
 * The Sell Us Your Car page's left card (global/sell/form.blade.php `.sell-intro`): the pill, the title, the lead and
 * the three perks. Hidden on phones (sell-page.css). Styled by sell-page.css.
 */
</script>

<template>
  <section class="sell-intro">
    <UiPagePill icon="logo-usd">GET TOP DOLLAR</UiPagePill>
    <h1 id="register" class="sell-title">Sell My <span>Car</span></h1>
    <p class="sell-lead">Get an instant cash offer online in under 2 minutes. Free appraisal — we buy all makes &amp; models.</p>
    <div class="sell-perks">
      <div class="sell-perk">
        <span class="sell-perk-ico"><Icon name="ion:checkbox-outline" aria-hidden="true" /></span>
        <div><strong>Free appraisal</strong><small>No obligation, no pressure.</small></div>
      </div>
      <div class="sell-perk">
        <span class="sell-perk-ico"><Icon name="ion:car-sport-outline" aria-hidden="true" /></span>
        <div><strong>All makes &amp; models</strong><small>Cars, trucks, SUVs and more.</small></div>
      </div>
      <div class="sell-perk">
        <span class="sell-perk-ico"><Icon name="ion:key-outline" aria-hidden="true" /></span>
        <div><strong>Trade or sell</strong><small>Put it toward your next ride or take the cash.</small></div>
      </div>
    </div>
  </section>
</template>
