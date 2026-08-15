/**
 * Firebase Storage Helper
 * Provides functions to get Firebase Storage URLs for client assets
 */

(function () {
  'use strict';

  var storage = window.FirebaseConfig && window.FirebaseConfig.storage;
  var urlCache = {}; // Cache URLs to avoid repeated API calls

  /**
   * Get Firebase Storage URL for a client asset
   * @param {string} clientName - Name of the client (e.g., 'bangari', 'vivekash')
   * @param {string} assetPath - Path to the asset relative to client folder (e.g., 'images/1.jpeg', 'song.mp3')
   * @returns {Promise<string>} Promise that resolves to the download URL
   */
  function getClientAssetUrl(clientName, assetPath) {
    if (!storage) {
      console.warn('Firebase Storage not initialized');
      return Promise.resolve(null);
    }

    var fullPath = 'client/valentine/' + clientName + '/' + assetPath;
    var cacheKey = fullPath;

    // Return cached URL if available
    if (urlCache[cacheKey]) {
      return Promise.resolve(urlCache[cacheKey]);
    }

    // Get reference and download URL
    var storageRef = storage.ref(fullPath);
    return storageRef.getDownloadURL()
      .then(function (url) {
        urlCache[cacheKey] = url;
        return url;
      })
      .catch(function (error) {
        console.warn('Failed to get Firebase Storage URL for', fullPath, error);
        return null;
      });
  }

  /**
   * Get Firebase Storage URL for a shared template asset
   * Automatically determines if it's an image/GIF or audio file
   * @param {string} assetPath - Filename of the asset (e.g., 'spinning.gif', 'bday_song.mp3')
   * @returns {Promise<string>} Promise that resolves to the download URL
   */
  function getSharedAssetUrl(assetPath) {
    if (!storage) {
      console.warn('Firebase Storage not initialized');
      return Promise.resolve(null);
    }

    // Determine if it's an image/GIF or audio file based on extension
    var ext = assetPath.split('.').pop().toLowerCase();
    var isAudio = ['.mp3', '.ogg', '.wav', '.m4a'].indexOf('.' + ext) !== -1;
    var folder = isAudio ? 'audios' : 'images';
    var fullPath = 'templates/shared/' + folder + '/' + assetPath;
    var cacheKey = fullPath;

    // Return cached URL if available
    if (urlCache[cacheKey]) {
      return Promise.resolve(urlCache[cacheKey]);
    }

    // Get reference and download URL
    var storageRef = storage.ref(fullPath);
    return storageRef.getDownloadURL()
      .then(function (url) {
        urlCache[cacheKey] = url;
        return url;
      })
      .catch(function (error) {
        console.warn('Failed to get Firebase Storage URL for', fullPath, error);
        return null;
      });
  }

  /**
   * Get client name from current page path
   * @returns {string|null} Client name or null
   */
  function getCurrentClientName() {
    if (window.ValentineGlobal && window.ValentineGlobal.getClientFromPath) {
      return window.ValentineGlobal.getClientFromPath();
    }
    // Fallback: try to get from pathname
    var path = (window.location.pathname || '').replace(/^\//, '').replace(/\/$/, '');
    var parts = path.split('/');
    return parts[0] || null;
  }

  /**
   * Set image source from Firebase Storage
   * @param {HTMLImageElement} imgElement - Image element to update
   * @param {string} assetPath - Path to the asset (e.g., 'images/1.jpeg')
   * @param {string} clientName - Optional client name, will be detected if not provided
   * @param {string} fallbackSrc - Optional fallback src if Firebase fails
   */
  function setImageSrcFromStorage(imgElement, assetPath, clientName, fallbackSrc) {
    if (!imgElement) return;

    clientName = clientName || getCurrentClientName();
    if (!clientName) {
      console.warn('Could not determine client name for asset', assetPath);
      if (fallbackSrc) imgElement.src = fallbackSrc;
      return;
    }

    getClientAssetUrl(clientName, assetPath)
      .then(function (url) {
        if (url) {
          imgElement.src = url;
        } else if (fallbackSrc) {
          imgElement.src = fallbackSrc;
        }
      });
  }

  /**
   * Set audio source from Firebase Storage
   * @param {HTMLAudioElement} audioElement - Audio element to update
   * @param {string} assetPath - Path to the asset (e.g., 'song.mp3')
   * @param {string} clientName - Optional client name, will be detected if not provided
   * @param {string} fallbackSrc - Optional fallback src if Firebase fails
   */
  function setAudioSrcFromStorage(audioElement, assetPath, clientName, fallbackSrc) {
    if (!audioElement) return;

    clientName = clientName || getCurrentClientName();
    if (!clientName) {
      console.warn('Could not determine client name for asset', assetPath);
      if (fallbackSrc) {
        var source = audioElement.querySelector('source');
        if (source) source.src = fallbackSrc;
      }
      return;
    }

    getClientAssetUrl(clientName, assetPath)
      .then(function (url) {
        if (url) {
          var source = audioElement.querySelector('source');
          if (source) {
            source.src = url;
            audioElement.load(); // Reload audio element with new source
          }
        } else if (fallbackSrc) {
          var source = audioElement.querySelector('source');
          if (source) {
            source.src = fallbackSrc;
            audioElement.load();
          }
        }
      });
  }

  /**
   * Set shared asset (GIF) source from Firebase Storage
   * @param {HTMLImageElement} imgElement - Image element to update
   * @param {string} assetPath - Path to the asset (e.g., 'spinning.gif')
   * @param {string} fallbackSrc - Optional fallback src if Firebase fails
   */
  function setSharedAssetSrc(imgElement, assetPath, fallbackSrc) {
    if (!imgElement) return;

    getSharedAssetUrl(assetPath)
      .then(function (url) {
        if (url) {
          imgElement.src = url;
        } else if (fallbackSrc) {
          imgElement.src = fallbackSrc;
        }
      });
  }

  /**
   * Get download URL for any storage path (client or shared). Uses FirebaseConfig.storage at call time.
   * @param {string} fullPath - Full storage path (e.g., 'client/birthdays/shaham/images/1.jpeg')
   * @returns {Promise<string|null>} Promise that resolves to the download URL or null
   */
  function getDownloadUrlByPath(fullPath) {
    var storageRef = window.FirebaseConfig && window.FirebaseConfig.storage;
    if (!storageRef || !storageRef.ref) {
      return Promise.resolve(null);
    }
    var cacheKey = fullPath;
    if (urlCache[cacheKey]) {
      return Promise.resolve(urlCache[cacheKey]);
    }
    return storageRef.ref(fullPath).getDownloadURL()
      .then(function (url) {
        urlCache[cacheKey] = url;
        return url;
      })
      .catch(function (error) {
        console.warn('Failed to get Firebase Storage URL for', fullPath, error);
        return null;
      });
  }

  /**
   * Construct Firebase Storage URL from storage path and token
   * @param {string} storagePath - Storage path (e.g., 'templates/shared/images/kiss.gif')
   * @param {string} token - Download token
   * @returns {string} Complete Firebase Storage URL
   */
  function constructFirebaseStorageUrl(storagePath, token) {
    var baseUrl = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;
    if (!baseUrl) {
      baseUrl = 'https://firebasestorage.googleapis.com/v0/b/my-bel0ved.firebasestorage.app/o/';
    }
    
    // Encode each path segment separately
    var pathParts = storagePath.split('/');
    var encodedParts = pathParts.map(function(part) {
      return encodeURIComponent(part);
    });
    var encodedPath = encodedParts.join('%2F');
    
    return baseUrl + encodedPath + '?alt=media&token=' + token;
  }

  /**
   * Initialize all assets on page load
   * Automatically finds and updates all images and audio sources
   */
  function initializeAssets() {
    if (!storage) {
      console.warn('Firebase Storage not initialized, skipping asset initialization');
      return;
    }

    var clientName = getCurrentClientName();
    if (!clientName) {
      console.warn('Could not determine client name, skipping asset initialization');
      return;
    }

    // Update client images (images/1.jpeg, images/2.jpeg, etc.)
    document.querySelectorAll('img[src^="images/"]').forEach(function(img) {
      var assetPath = img.getAttribute('src');
      var fallbackSrc = assetPath;
      setImageSrcFromStorage(img, assetPath, clientName, fallbackSrc);
    });

    // Update shared GIFs (images_and_gifs folder)
    document.querySelectorAll('img[src*="images_and_gifs"]').forEach(function(img) {
      var src = img.getAttribute('src');
      // Extract filename from path (handle %20 encoding)
      var filename = src.split('/').pop().replace(/%20/g, ' ');
      var fallbackSrc = src;
      setSharedAssetSrc(img, filename, fallbackSrc);
    });

    // Update audio sources
    document.querySelectorAll('audio source[src^="images/"]').forEach(function(source) {
      var assetPath = source.getAttribute('src');
      var audio = source.closest('audio');
      var fallbackSrc = assetPath;
      setAudioSrcFromStorage(audio, assetPath, clientName, fallbackSrc);
    });

    // Also handle audio sources with shared assets path
    document.querySelectorAll('audio source[src*="images_and_gifs"]').forEach(function(source) {
      var src = source.getAttribute('src');
      var filename = src.split('/').pop().replace(/%20/g, ' ');
      var audio = source.closest('audio');
      var fallbackSrc = src;
      getSharedAssetUrl(filename)
        .then(function(url) {
          if (url && source) {
            source.src = url;
            audio.load();
          } else if (fallbackSrc && source) {
            source.src = fallbackSrc;
            audio.load();
          }
        });
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAssets);
  } else {
    // DOM already loaded
    initializeAssets();
  }

  // Export to global scope
  window.FirebaseStorage = {
    getClientAssetUrl: getClientAssetUrl,
    getSharedAssetUrl: getSharedAssetUrl,
    getDownloadUrlByPath: getDownloadUrlByPath,
    getCurrentClientName: getCurrentClientName,
    setImageSrcFromStorage: setImageSrcFromStorage,
    setAudioSrcFromStorage: setAudioSrcFromStorage,
    setSharedAssetSrc: setSharedAssetSrc,
    initializeAssets: initializeAssets,
    constructFirebaseStorageUrl: constructFirebaseStorageUrl
  };
})();
