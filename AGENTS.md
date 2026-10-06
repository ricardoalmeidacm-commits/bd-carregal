<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Audio playback uses a two-step prepare-then-play flow so mobile browsers receive `speechSynthesis.speak()` directly from a user gesture.
- Self-hosted builds use Nitro preset node-server (vite.config.ts) — target is Hetzner/PM2/Nginx; Lovable builds pin their own preset.
