
// 0. Retrieve all options
const retrieving = browser.storage.sync.get();

retrieving.then(options => {
    const hideIncompleteData = options.hideIncompleteData !== false;

    // 1. Retrieve all products
    const elements = Array.from(document.querySelectorAll(".priceTable tr:not(.nocost) > :nth-child(2) > p.ellipsis > a"))
    const productNames = elements.map(link => link.textContent);
    const productCodes = elements.map(link => link.href.match(/\/(\d+)\//)[1]);

    // 2. Send GET requests for each product code
    const requests = productCodes.map(code => fetch(`https://tweakers.net/ajax/price_chart/${code}/nl/?output=json`)
        .then(response => response.ok ? response.json() : {dataset: {source: []}}));

    Promise.all(requests).then(data => {
        // 3. Group results by date
        const results = {};
        const count = new Array(productCodes.length);
        data.forEach(({ dataset: { source } }, index) => {
            source.forEach(([date, minPrice, _]) => {
                if (!results[date]) {
                    results[date] = new Array(productCodes.length).fill(0);
                }
                results[date][index] = minPrice;
                count[index]++;
            });
        });

        // 4. Hide incomplete data
        if (hideIncompleteData) {
            const availableProducts = count.filter(x => x !== 0).length;

            Object.keys(results).forEach(date => {
                if (results[date].filter(x => x !== 0).length !== availableProducts)
                    delete results[date];
            });
        }

        // 5. Sort the results by date
        const sortedKeys = Object.keys(results).sort();
        if (sortedKeys.length === 0) return;

        // 6. Chart configuration
        const dataset = {
            labels: sortedKeys,
            datasets: productNames.map((name, index) => { return {
                label: name,
                data: sortedKeys.map(key => results[key][index]),
                fill: true
            }})
        };

        const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
        const config = {
            type: "line",
            data: dataset,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        itemSort: (a, b) => b.datasetIndex - a.datasetIndex,
                        callbacks: {
                            label: context => ` ${euro.format(context.parsed.y).padEnd(12)} | ${context.dataset.label}`,
                            footer: items => `Totaal: ${euro.format(items.reduce((a, b) => a + b.parsed.y, 0))}`
                        },
                        bodyFont: {
                            family: "monospace"
                        }
                    }
                },
                interaction: {
                    mode: "index",
                    axis: "x",
                    intersect: false
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                scales: {
                    x : {
                        ticks : {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        stacked: true,
                        min: 0,
                        ticks: {
                            callback: euro.format
                        }
                    }
                }
            }
        };

        // 7. Add chart to the page
        const content = document.querySelector(".content");

        const title = Object.assign(document.createElement("h3"), {className: "bar", textContent: "Prijsgeschiedenis"});
        title.style.marginBottom = "10px";
        content.appendChild(title);

        const container = document.createElement("div");
        content.appendChild(container);

        const canvas = Object.assign(document.createElement("canvas"), {width: 400, height: 150});
        const ctx = canvas.getContext('2d');
        container.appendChild(canvas);
        new Chart(ctx, config);
    });
});
