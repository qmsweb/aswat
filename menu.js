/* ========================================================= */
/* صوامت - لوجيك القائمة الجانبية للموبايل                    */
/* ========================================================= */
(function () {
    var drawer = document.getElementById('mobileDrawer');
    var overlay = document.getElementById('drawerOverlay');
    var toggleBtn = document.querySelector('.menu-toggle-btn');

    function isOpen() {
        return drawer && drawer.classList.contains('open');
    }

    function openDrawer() {
        if (!drawer) return;
        drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.classList.add('no-scroll');
        if (document.documentElement) document.documentElement.classList.add('no-scroll');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
        if (!drawer) return;
        drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
        if (document.documentElement) document.documentElement.classList.remove('no-scroll');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }

    window.openDrawer = openDrawer;
    window.closeDrawer = closeDrawer;

    window.toggleMobileDrawer = function () {
        if (isOpen()) {
            closeDrawer();
        } else {
            openDrawer();
        }
    };

    window.closeMobileDrawer = closeDrawer;

    if (overlay) {
        overlay.addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) {
            closeDrawer();
        }
    });

    /* تمييز الرابط النشط في القائمة حسب الصفحة الحالية */
    function highlightActiveLink() {
        var path = window.location.pathname.replace(/\/+$/, '');
        var links = document.querySelectorAll('.drawer-links a, .nav-links a');
        for (var i = 0; i < links.length; i++) {
            var linkPath = links[i].getAttribute('href');

            if (!linkPath) continue;

            /* تجاهل الروابط الخارجية */
            if (/^https?:\/\//i.test(linkPath)) {
                if (linkPath.indexOf(window.location.origin) === -1) continue;
                linkPath = linkPath.replace(window.location.origin, '');
            }

            linkPath = linkPath.replace(/\/+$/, '');

            var isActive = false;
            if (path === '' || path === '/') {
                isActive = (linkPath === '' || linkPath === '/');
            } else {
                if (linkPath === '') {
                    isActive = false;
                } else if (path === linkPath) {
                    isActive = true;
                } else if (linkPath === '/' + path.split('/')[1]) {
                    isActive = true;
                }
            }

            if (isActive) {
                links[i].classList.add('active');
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', highlightActiveLink);
    } else {
        highlightActiveLink();
    }

    /* حفظ الشعار في المتصفح (localStorage) كي لا يُعاد تحميله من الشبكة في كل زيارة */
    var LOGO_KEY = 'sawamet-logo-v1';

    function applyCachedLogo(src) {
        var imgs = document.querySelectorAll('.brand-logo');
        for (var i = 0; i < imgs.length; i++) {
            if (imgs[i].getAttribute('data-logo-cached')) continue;
            imgs[i].setAttribute('src', src);
            imgs[i].setAttribute('data-logo-cached', '1');
        }
    }

    function cacheLogo() {
        var logoEl = document.querySelector('.brand-logo');
        if (!logoEl || !('fetch' in window)) return;
        var LOGO_URL = logoEl.getAttribute('src');
        if (!LOGO_URL) return;

        fetch(LOGO_URL)
            .then(function (res) {
                if (!res.ok) throw new Error('logo');
                return res.blob();
            })
            .then(function (blob) {
                if (blob.size > 4 * 1024 * 1024) return;
                var reader = new FileReader();
                reader.onload = function () {
                    try { localStorage.setItem(LOGO_KEY, reader.result); } catch (e) {}
                    applyCachedLogo(reader.result);
                };
                reader.readAsDataURL(blob);
            })
            .catch(function () {});
    }

    try {
        var stored = localStorage.getItem(LOGO_KEY);
        if (stored) {
            applyCachedLogo(stored);
        } else if ('requestIdleCallback' in window) {
            requestIdleCallback(cacheLogo, { timeout: 3000 });
        } else {
            setTimeout(cacheLogo, 1500);
        }
    } catch (e) {}

    /* تسجيل عامل الخدمة لتخزين الملفات الثابتة (يفعّل مرة واحدة فقط) */
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
    }
})();