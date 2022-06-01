"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
/* eslint-disable complexity */
var path_1 = require("path");
var fs_1 = require("fs");
var mkdirp_1 = require("mkdirp");
var got_1 = require("got");
var cli_progress_1 = require("cli-progress");
var svgo_1 = require("svgo");
var ffmpeg_1 = require("@ffmpeg/ffmpeg");
// Max width that can be handled by the contentful image api
var contentfulMaxWidth = 4000;
// Some image formats (avif) have an additional limitation on the megapixel size
var maxMegaPixels = {
    avif: 9
};
/**
 *
 * @param {*} options
 * @returns
 */
var processOptions = function (options) {
    if (options === void 0) { options = {}; }
    var defaultOptions = {
        sizes: [1920, 1280, 640, 320],
        rootDir: process.cwd(),
        assetBase: '/assets/cf',
        assetFolder: 'static',
        cacheFolder: '.cache',
        extraTypes: ['image/avif', 'image/webp'],
        quality: 80,
        ratios: {},
        focusAreas: {}
    };
    var _a = __assign(__assign({}, defaultOptions), options), rootDir = _a.rootDir, cacheFolder = _a.cacheFolder, assetFolder = _a.assetFolder;
    return __assign(__assign(__assign({}, defaultOptions), { rootDir: rootDir, assetFolder: assetFolder, cacheFolder: cacheFolder, cachePath: (0, path_1.resolve)(rootDir, cacheFolder), assetPath: (0, path_1.resolve)(rootDir, assetFolder) }), options);
};
exports["default"] = (function (pluginOptions) {
    var queue = new Set();
    var posterQueue = new Set();
    var options = processOptions(pluginOptions);
    var ffmpeg = (0, ffmpeg_1.createFFmpeg)();
    var generatePosterImageSrc = function (src, sys) {
        var filepath = getLocalPath(src, sys, !options.download);
        var posterFilePath = "".concat(filepath.replace(/\.\w+$/, ''), "-poster.jpg");
        posterQueue.add(JSON.stringify({
            src: filepath,
            dest: posterFilePath
        }));
        return posterFilePath;
    };
    var generatePosterImage = function (src, dest) { return __awaiter(void 0, void 0, void 0, function () {
        var srcPath, destPath, tmpSrc, tmpDest, additionalArgs, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    srcPath = (0, path_1.join)(options.assetPath, src);
                    destPath = (0, path_1.join)(options.assetPath, dest);
                    tmpSrc = src.replace(/^\//, '').replace(/\//g, '-');
                    tmpDest = dest.replace(/^\//, '').replace(/\//g, '-');
                    additionalArgs = [];
                    if (options.posterPosition) {
                        additionalArgs = __spreadArray(__spreadArray([], additionalArgs, true), ['-ss', options.posterPosition], false);
                    }
                    if (options.posterSize) {
                        additionalArgs = __spreadArray(__spreadArray([], additionalArgs, true), ['-s', options.posterSize], false);
                    }
                    // Write file to MEMFS first so that ffmpeg.wasm is able to consume it
                    // eslint-disable-next-line new-cap
                    _b = (_a = ffmpeg).FS;
                    _c = ['writeFile', tmpSrc];
                    return [4 /*yield*/, (0, ffmpeg_1.fetchFile)(srcPath)];
                case 1:
                    // Write file to MEMFS first so that ffmpeg.wasm is able to consume it
                    // eslint-disable-next-line new-cap
                    _b.apply(_a, _c.concat([_d.sent()]));
                    return [4 /*yield*/, ffmpeg.run.apply(ffmpeg, __spreadArray(__spreadArray(['-i', tmpSrc], additionalArgs, false), ['-vframes', '1', '-f', 'image2', tmpDest], false))];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, fs_1.promises.writeFile(destPath, 
                        // eslint-disable-next-line new-cap
                        ffmpeg.FS('readFile', tmpDest))];
                case 3:
                    _d.sent();
                    return [2 /*return*/, destPath];
            }
        });
    }); };
    var generatePosterImages = function () { return __awaiter(void 0, void 0, void 0, function () {
        var files, bar, progress, _i, files_1, file, src, dest, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    files = __spreadArray([], posterQueue, true).map(function (json) { return JSON.parse(json); });
                    bar = new cli_progress_1.SingleBar({
                        format: '    ➞ Generating poster images: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
                    }, cli_progress_1.Presets.legacy);
                    progress = 0;
                    // Start the progress bar with a total value of 200 and start value of 0
                    bar.start(files.length, 0);
                    _i = 0, files_1 = files;
                    _a.label = 1;
                case 1:
                    if (!(_i < files_1.length)) return [3 /*break*/, 6];
                    file = files_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    src = file.src, dest = file.dest;
                    // eslint-disable-next-line no-await-in-loop
                    return [4 /*yield*/, generatePosterImage(src, dest)];
                case 3:
                    // eslint-disable-next-line no-await-in-loop
                    _a.sent();
                    progress++;
                    bar.update(progress);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.log(error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    bar.stop();
                    return [2 /*return*/, true];
            }
        });
    }); };
    var getLocalPath = function (src, sys, addToQueue) {
        if (addToQueue === void 0) { addToQueue = true; }
        var url = new URL(src);
        var updatedAt = (sys || {}).updatedAt;
        var searchParams = url.searchParams, pathname = url.pathname;
        var extname = (0, path_1.extname)(pathname);
        var filename = (0, path_1.basename)(pathname, extname);
        var params = new URLSearchParams(searchParams);
        var _a = Object.fromEntries(params.entries()), w = _a.w, h = _a.h, f = _a.f, _b = _a.fm, fm = _b === void 0 ? extname.substring(1) : _b;
        var _c = (0, path_1.dirname)(pathname).split('/'), assetId = _c[2];
        var file = [filename, w ? "-w".concat(w) : '', h ? "-h".concat(h) : '', f ? "-".concat(f) : '', '.', fm]
            .filter(function (v) { return v; })
            .join('');
        var queueEntry = {
            src: src,
            timestamp: updatedAt ? Date.parse(updatedAt) : 0
        };
        if (addToQueue) {
            queue.add(JSON.stringify(queueEntry));
        }
        return (0, path_1.join)(options.assetBase, assetId, file);
    };
    var getModifiedTime = function (file) { return __awaiter(void 0, void 0, void 0, function () {
        var mtime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(0, fs_1.existsSync)(file)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs_1.promises.stat(file)];
                case 1:
                    mtime = (_a.sent()).mtime;
                    return [2 /*return*/, Date.parse(mtime.toISOString())];
                case 2: return [2 /*return*/, 0];
            }
        });
    }); };
    var getLocalSrc = function (src, sys, addToQueue) {
        if (addToQueue === void 0) { addToQueue = true; }
        var localPath = getLocalPath(src, sys, addToQueue);
        if (process.env.HUGO_BASEURL) {
            return (0, path_1.join)('/', process.env.HUGO_BASEURL, localPath);
        }
        return localPath;
    };
    var readAsset = function (asset) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, sys, fields, _b, createdAt, updatedAt, fileUrl, src, timestamp, url, filepath, _c, _d, response, buffer, _e;
        var _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _a = asset || {}, sys = _a.sys, fields = _a.fields;
                    _b = sys || {}, createdAt = _b.createdAt, updatedAt = _b.updatedAt;
                    fileUrl = (_g = (_f = fields === null || fields === void 0 ? void 0 : fields.file) === null || _f === void 0 ? void 0 : _f.url) !== null && _g !== void 0 ? _g : '';
                    src = fileUrl.startsWith('//') ? "https:".concat(fileUrl) : fileUrl;
                    if (!src) {
                        return [2 /*return*/];
                    }
                    timestamp = Date.parse(updatedAt || createdAt) || 0;
                    url = new URL(src);
                    filepath = (0, path_1.join)(options.cachePath, getLocalPath(src, {}, false));
                    return [4 /*yield*/, (0, mkdirp_1["default"])((0, path_1.dirname)(filepath))];
                case 1:
                    _h.sent();
                    _c = !(0, fs_1.existsSync)(filepath) || !timestamp;
                    if (_c) return [3 /*break*/, 3];
                    _d = timestamp;
                    return [4 /*yield*/, getModifiedTime(filepath)];
                case 2:
                    _c = _d > (_h.sent());
                    _h.label = 3;
                case 3:
                    if (!_c) return [3 /*break*/, 8];
                    _h.label = 4;
                case 4:
                    _h.trys.push([4, 7, , 8]);
                    response = (0, got_1["default"])(url);
                    return [4 /*yield*/, response.buffer()];
                case 5:
                    buffer = _h.sent();
                    return [4 /*yield*/, fs_1.promises.writeFile(filepath, buffer)];
                case 6:
                    _h.sent();
                    return [3 /*break*/, 8];
                case 7:
                    _e = _h.sent();
                    console.log('Error downloading image:', url);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/, fs_1.promises.readFile(filepath, 'utf8')];
            }
        });
    }); };
    var fetchAsset = function (src, timestamp) { return __awaiter(void 0, void 0, void 0, function () {
        var url, filepath, cacheFile, file, _a, _b, _c, response, buffer, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    url = new URL(src);
                    filepath = getLocalPath(src, {}, false);
                    cacheFile = (0, path_1.join)(options.cachePath, filepath);
                    file = (0, path_1.join)(options.assetPath, filepath);
                    return [4 /*yield*/, (0, mkdirp_1["default"])((0, path_1.dirname)(cacheFile))];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, (0, mkdirp_1["default"])((0, path_1.dirname)(file))];
                case 2:
                    _e.sent();
                    _a = !(0, fs_1.existsSync)(cacheFile);
                    if (_a) return [3 /*break*/, 5];
                    _b = timestamp;
                    if (!_b) return [3 /*break*/, 4];
                    _c = timestamp;
                    return [4 /*yield*/, getModifiedTime(cacheFile)];
                case 3:
                    _b = _c > (_e.sent());
                    _e.label = 4;
                case 4:
                    _a = (_b);
                    _e.label = 5;
                case 5:
                    if (!_a) return [3 /*break*/, 10];
                    _e.label = 6;
                case 6:
                    _e.trys.push([6, 9, , 10]);
                    response = (0, got_1["default"])(url);
                    return [4 /*yield*/, response.buffer()];
                case 7:
                    buffer = _e.sent();
                    return [4 /*yield*/, fs_1.promises.writeFile(cacheFile, buffer)];
                case 8:
                    _e.sent();
                    return [3 /*break*/, 10];
                case 9:
                    _d = _e.sent();
                    console.log('Error downloading image:', url);
                    return [3 /*break*/, 10];
                case 10: return [4 /*yield*/, fs_1.promises.copyFile(cacheFile, file)];
                case 11:
                    _e.sent();
                    return [2 /*return*/, filepath];
            }
        });
    }); };
    var fetchAssets = function () { return __awaiter(void 0, void 0, void 0, function () {
        var files, bar, progress;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    files = __spreadArray([], queue, true).map(function (json) { return JSON.parse(json); });
                    bar = new cli_progress_1.SingleBar({ format: '    ➞ Fetching files: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}' }, cli_progress_1.Presets.legacy);
                    progress = 0;
                    // Start the progress bar with a total value of 200 and start value of 0
                    bar.start(files.length, 0);
                    return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(void 0, void 0, void 0, function () {
                            var src, timestamp, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        src = file.src, timestamp = file.timestamp;
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, fetchAsset(src, timestamp)];
                                    case 2:
                                        _a.sent();
                                        progress++;
                                        bar.update(progress);
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_2 = _a.sent();
                                        console.log(error_2);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 1:
                    _a.sent();
                    bar.stop();
                    return [2 /*return*/, true];
            }
        });
    }); };
    var getImageData = function (asset, ratio, focusArea) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var _j = (_d = (_c = (_b = (_a = asset === null || asset === void 0 ? void 0 : asset.fields) === null || _a === void 0 ? void 0 : _a.file) === null || _b === void 0 ? void 0 : _b.details) === null || _c === void 0 ? void 0 : _c.image) !== null && _d !== void 0 ? _d : {}, width = _j.width, height = _j.height;
        var mimeType = (_f = (_e = asset === null || asset === void 0 ? void 0 : asset.fields) === null || _e === void 0 ? void 0 : _e.file) === null || _f === void 0 ? void 0 : _f.contentType;
        var url = (_h = (_g = asset === null || asset === void 0 ? void 0 : asset.fields) === null || _g === void 0 ? void 0 : _g.file) === null || _h === void 0 ? void 0 : _h.url;
        var types = __spreadArray([], new Set(__spreadArray(__spreadArray([], (options.extraTypes || []), true), [mimeType], false)), true);
        var sizes = (options.sizes || []).map(function (value) {
            if (typeof value === 'function') {
                return value(asset, ratio, focusArea);
            }
            return parseFloat(value.toString());
        });
        if (!url || !width || !height) {
            return {};
        }
        var src = url.startsWith('//') ? "https:".concat(url) : url;
        // Compute possible widths considering ratio & contentful max size
        var widths = __spreadArray([], new Set((ratio
            ? __spreadArray([
                contentfulMaxWidth,
                contentfulMaxWidth * ratio,
                width,
                Math.floor(height * ratio)
            ], sizes, true) : __spreadArray([contentfulMaxWidth, width], sizes, true))
            .sort(function (a, b) { return b - a; })
            .filter(function (w) {
            return w <= width &&
                w <= contentfulMaxWidth &&
                (!ratio || (w / ratio <= contentfulMaxWidth && w / ratio <= height));
        })
            .map(function (w) { return Math.round(w); })), true);
        var maxWidth = widths[0];
        var maxHeight = Math.round(maxWidth / (ratio || width / height));
        var sizesAttribute = "(max-width: ".concat(maxWidth, "px) 100vw, ").concat(maxWidth, "px");
        var sizeParams = function (width, ratio) {
            if (!ratio) {
                return "w=".concat(width);
            }
            return [
                'fit=fill',
                "w=".concat(width),
                "h=".concat(Math.floor(width / ratio)),
                "f=".concat(focusArea || 'center'),
            ].join('&');
        };
        var megaPixelFilter = function (w, type) {
            if (type === void 0) { type = '-'; }
            var max = maxMegaPixels === null || maxMegaPixels === void 0 ? void 0 : maxMegaPixels[type.replace('image/', '')];
            var r = ratio || width / height;
            return !max || max >= (w * Math.floor(w / r)) / 1000000;
        };
        var sources = Object.fromEntries(types.map(function (type) {
            var fm = type === mimeType ? '' : "&fm=".concat(type.replace('image/', ''));
            return [
                type,
                widths
                    .filter(function (w) { return megaPixelFilter(w, type); })
                    .map(function (w) { return ({
                    src: "".concat(src, "?").concat(sizeParams(w, ratio), "&q=").concat(options.quality).concat(fm),
                    width: w
                }); }),
            ];
        }));
        var assetFile = sources[mimeType][0];
        var assetSrc = assetFile.src;
        // Fetch original src and srcsets for production use
        var finalSrc = options.download ? getLocalSrc(assetSrc, asset.sys) : assetSrc;
        var finalSrcsets = Object.entries(sources).map(function (_a) {
            var type = _a[0], files = _a[1];
            var srcset = files.map(function (file) {
                var width = file.width, src = file.src;
                return "".concat(options.download ? getLocalSrc(src, asset.sys) : src, " ").concat(width, "w");
            });
            return {
                type: type,
                srcset: srcset.join(', ')
            };
        });
        return {
            width: maxWidth,
            height: maxHeight,
            sizes: sizesAttribute,
            srcsets: finalSrcsets,
            src: finalSrc
        };
    };
    var mapAssetLink = function (transformContext, runtimeContext, defaultValue) { return __awaiter(void 0, void 0, void 0, function () {
        var download, asset, entry, fieldId, sys, url, _a, mimeType, src, defaultRatio, contentTypeDefaultRatio, _b, _c, contentTypeRatios, ratioConfig, defaultFocusArea, contentTypeDefaultFocusArea, _d, _e, focusAreaConfig, focusArea, source, optimized, original, derivatives;
        var _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
        return __generator(this, function (_12) {
            switch (_12.label) {
                case 0:
                    download = (options || {}).download;
                    asset = transformContext.asset, entry = transformContext.entry, fieldId = transformContext.fieldId;
                    sys = (asset || {}).sys;
                    url = defaultValue.url, _a = defaultValue.mimeType, mimeType = _a === void 0 ? '' : _a;
                    src = url.startsWith('//') ? "https:".concat(url) : url;
                    defaultRatio = (_g = (_f = entry === null || entry === void 0 ? void 0 : entry.fields) === null || _f === void 0 ? void 0 : _f.ratio) !== null && _g !== void 0 ? _g : (_h = options === null || options === void 0 ? void 0 : options.ratios) === null || _h === void 0 ? void 0 : _h["default"];
                    contentTypeDefaultRatio = (_q = (_p = (_j = options === null || options === void 0 ? void 0 : options.ratios) === null || _j === void 0 ? void 0 : _j[(_o = (_m = (_l = (_k = entry === null || entry === void 0 ? void 0 : entry.sys) === null || _k === void 0 ? void 0 : _k.contentType) === null || _l === void 0 ? void 0 : _l.sys) === null || _m === void 0 ? void 0 : _m.id) !== null && _o !== void 0 ? _o : 'unknown']) === null || _p === void 0 ? void 0 : _p["default"]) !== null && _q !== void 0 ? _q : defaultRatio;
                    _b = options.ratios, _c = (_u = (_t = (_s = (_r = entry === null || entry === void 0 ? void 0 : entry.sys) === null || _r === void 0 ? void 0 : _r.contentType) === null || _s === void 0 ? void 0 : _s.sys) === null || _t === void 0 ? void 0 : _t.id) !== null && _u !== void 0 ? _u : 'unknown', contentTypeRatios = _b[_c];
                    ratioConfig = (_v = contentTypeRatios === null || contentTypeRatios === void 0 ? void 0 : contentTypeRatios[fieldId]) !== null && _v !== void 0 ? _v : contentTypeDefaultRatio;
                    defaultFocusArea = (_z = (_x = (_w = entry === null || entry === void 0 ? void 0 : entry.fields) === null || _w === void 0 ? void 0 : _w.focus_area) !== null && _x !== void 0 ? _x : (_y = options === null || options === void 0 ? void 0 : options.focusAreas) === null || _y === void 0 ? void 0 : _y["default"]) !== null && _z !== void 0 ? _z : 'center';
                    contentTypeDefaultFocusArea = (_6 = (_5 = (_0 = options === null || options === void 0 ? void 0 : options.focusAreas) === null || _0 === void 0 ? void 0 : _0[(_4 = (_3 = (_2 = (_1 = entry === null || entry === void 0 ? void 0 : entry.sys) === null || _1 === void 0 ? void 0 : _1.contentType) === null || _2 === void 0 ? void 0 : _2.sys) === null || _3 === void 0 ? void 0 : _3.id) !== null && _4 !== void 0 ? _4 : 'unknown']) === null || _5 === void 0 ? void 0 : _5["default"]) !== null && _6 !== void 0 ? _6 : defaultFocusArea;
                    _d = options.focusAreas, _e = (_10 = (_9 = (_8 = (_7 = entry === null || entry === void 0 ? void 0 : entry.sys) === null || _7 === void 0 ? void 0 : _7.contentType) === null || _8 === void 0 ? void 0 : _8.sys) === null || _9 === void 0 ? void 0 : _9.id) !== null && _10 !== void 0 ? _10 : 'unknown', focusAreaConfig = _d[_e];
                    focusArea = (_11 = focusAreaConfig === null || focusAreaConfig === void 0 ? void 0 : focusAreaConfig[fieldId]) !== null && _11 !== void 0 ? _11 : contentTypeDefaultFocusArea;
                    if (!(mimeType === 'image/svg+xml')) return [3 /*break*/, 3];
                    return [4 /*yield*/, readAsset(asset)];
                case 1:
                    source = _12.sent();
                    return [4 /*yield*/, (0, svgo_1.optimize)(source, {
                            multipass: true,
                            plugins: [
                                {
                                    name: 'preset-default',
                                    params: {
                                        overrides: {
                                            removeViewBox: false
                                        }
                                    }
                                },
                                'removeDimensions',
                                {
                                    name: 'removeAttrs',
                                    params: {
                                        attrs: 'fill'
                                    }
                                },
                            ]
                        })];
                case 2:
                    optimized = (_12.sent()).data;
                    // Add viewBox if not present
                    return [2 /*return*/, __assign(__assign({}, defaultValue), { source: optimized, srcsets: [], src: download ? getLocalSrc(src, sys) : src })];
                case 3:
                    if (mimeType.startsWith('image')) {
                        original = getImageData(asset, undefined, focusArea);
                        derivatives = Object.fromEntries(Object.entries(ratioConfig || {}).map(function (_a) {
                            var name = _a[0], ratio = _a[1];
                            return [
                                name,
                                getImageData(asset, ratio, focusArea),
                            ];
                        }));
                        return [2 /*return*/, __assign(__assign({}, defaultValue), { src: original.src, derivatives: __assign({ original: original }, derivatives) })];
                    }
                    if (mimeType.startsWith('video') && options.generatePosterImages) {
                        return [2 /*return*/, __assign(__assign({}, defaultValue), { src: download ? getLocalSrc(src, sys) : src, poster: generatePosterImageSrc(src, sys) })];
                    }
                    return [2 /*return*/, __assign(__assign({}, defaultValue), { src: download ? getLocalSrc(src, sys) : src })];
            }
        });
    }); };
    var after = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(options.download || options.generatePosterImages)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fetchAssets()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!options.generatePosterImages) return [3 /*break*/, 5];
                    return [4 /*yield*/, ffmpeg.load()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, generatePosterImages()];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return {
        after: after,
        mapAssetLink: mapAssetLink
    };
});
