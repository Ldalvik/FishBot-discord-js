module.exports = {
        DEFAULTS: {
            level: 1,
            xp: 0,
            cap: 100,
            deltaNext: 50
        },
        set: function (xp, deltaNext) {
            return (1 + Math.sqrt(1 + 8 * xp / deltaNext)) / 2;
        },
        getXPtoLevel: function (level, deltaNext) {
            return ((Math.pow(level, 2) - level) * deltaNext) / 2
        },
        parseByXP: function (xp, cap, deltaNext) {
            xp = xp === undefined ? this.DEFAULTS.xp : xp
            cap = cap === undefined ? this.DEFAULTS.cap : cap
            deltaNext = deltaNext === undefined ? this.DEFAULTS.deltaNext : deltaNext
            var l = this.set(xp, deltaNext)
            l = l > cap ? cap : l
            var level = Math.floor(l),
                forNext = this.getXPtoLevel(level + 1, deltaNext)
            forNext = l === cap ? Infinity : forNext
            var toNext = l === cap ? Infinity : forNext - xp
            var forLast = this.getXPtoLevel(level, deltaNext)
            return {
                deltaNext,
                level: level,
                levelFrac: l,
                xp: xp,
                per: (xp - forLast) / (forNext - forLast),
                forNext: forNext,
                toNext: toNext,
                forLast: forLast
            }
        }
        // return {
        //     parseByLevel: function (l, cap, deltaNext) {
        //         l = l === undefined ? DEFAULTS.level : l
        //         deltaNext = deltaNext === undefined ? DEFAULTS.deltaNext : deltaNext
        //         var xp = getXPtoLevel(l, deltaNext)
        //         console.log(xp)
        //         return parseByXP(xp, cap, deltaNext)
        //     },
        //     parseByXP: parseByXP
        // }
    }