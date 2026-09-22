/**
 * CashFlowShield AI - Interactive Canvas Forecast Chart Component
 * Native high-performance HTML5 Canvas rendering with smooth bezier curves,
 * crosshair tracking, gradient fills, and interactive tooltips.
 */

export class ForecastChart {
  constructor(canvasElement, tooltipElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.tooltip = tooltipElement;
    this.data = null;
    this.hoverIndex = -1;
    this.currencySymbol = "₹";

    // Scenario visibility toggles
    this.visibleSeries = {
      baseline: true,
      atRisk: true,
      protected: true,
      threshold: true
    };
    this.horizon = 30;

    this.initEvents();
  }

  setCurrency(symbol = "₹") {
    this.currencySymbol = symbol;
    if (this.data) this.render();
  }

  setHorizon(days = 30) {
    this.horizon = Number(days) || 30;
    this.render();
  }

  getVisiblePoints() {
    if (!this.data || !this.data.points) return [];
    if (this.horizon && this.horizon < 30) {
      const filtered = this.data.points.filter(p => p.day <= this.horizon);
      return filtered.length > 0 ? filtered : this.data.points;
    }
    return this.data.points;
  }

  toggleSeries(seriesName) {
    if (this.visibleSeries[seriesName] !== undefined) {
      this.visibleSeries[seriesName] = !this.visibleSeries[seriesName];
      this.render();
    }
  }

  updateData(forecastResult) {
    this.data = forecastResult;
    this.render();
  }

  initEvents() {
    if (!this.canvas) return;

    window.addEventListener('resize', () => {
      this.render();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const points = this.getVisiblePoints();
      if (!points || points.length === 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const paddingLeft = 65;
      const paddingRight = 30;
      const chartWidth = rect.width - paddingLeft - paddingRight;

      const pointsCount = points.length;
      const stepX = chartWidth / Math.max(1, pointsCount - 1);

      let closestIdx = Math.round((mouseX - paddingLeft) / stepX);
      closestIdx = Math.max(0, Math.min(pointsCount - 1, closestIdx));

      this.hoverIndex = closestIdx;
      this.render();
      this.showTooltip(rect, closestIdx, mouseX, mouseY, points);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = -1;
      this.render();
      if (this.tooltip) {
        this.tooltip.style.opacity = '0';
        this.tooltip.style.pointerEvents = 'none';
      }
    });
  }

  showTooltip(rect, index, mouseX, mouseY, points = null) {
    const pts = points || this.getVisiblePoints();
    if (!this.tooltip || !pts[index]) return;
    const pt = pts[index];

    const formatNum = (v) => {
      if (Math.abs(v) >= 100000) {
        return `${this.currencySymbol}${(v / 100000).toFixed(2)}L`;
      }
      return `${this.currencySymbol}${Math.round(v).toLocaleString('en-IN')}`;
    };

    let eventsHtml = '';
    if (pt.events && pt.events.length > 0) {
      eventsHtml = `
        <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.1); font-size:11px; color:#CBD5E1;">
          <strong>Key Inflows / Outflows:</strong>
          <ul style="margin:4px 0 0 14px; padding:0;">
            ${pt.events.map(ev => `<li>${ev}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    this.tooltip.innerHTML = `
      <div style="font-weight:700; color:#F8FAFC; margin-bottom:4px; font-size:12px;">${pt.dateStr || 'Day ' + pt.day} (Day ${pt.day})</div>
      <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:3px; font-size:12px;">
        <span style="color:#818CF8;">● Baseline Forecast:</span>
        <strong>${formatNum(pt.baseline)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:3px; font-size:12px;">
        <span style="color:#FDA4AF;">● At-Risk Stress:</span>
        <strong style="color:#FDA4AF;">${formatNum(pt.atRisk)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:3px; font-size:12px;">
        <span style="color:#34D399;">● Shield Protected:</span>
        <strong style="color:#34D399;">${formatNum(pt.protected)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; gap:12px; font-size:11px; color:#94A3B8; margin-top:4px;">
        <span>Daily In: <span style="color:#60A5FA;">+${formatNum(pt.inflows)}</span></span>
        <span>Daily Out: <span style="color:#F87171;">-${formatNum(pt.outflows)}</span></span>
      </div>
      ${eventsHtml}
    `;

    // Tooltip positioning
    const tooltipWidth = 240;
    let leftPos = mouseX + 15;
    if (leftPos + tooltipWidth > rect.width) {
      leftPos = mouseX - tooltipWidth - 15;
    }

    this.tooltip.style.left = `${leftPos}px`;
    this.tooltip.style.top = `${Math.max(10, mouseY - 50)}px`;
    this.tooltip.style.opacity = '1';
    this.tooltip.style.pointerEvents = 'none';
  }

  render() {
    const points = this.getVisiblePoints();
    if (!this.canvas || !points || points.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const padLeft = 65;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 40;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Determine value range (min and max across visible points)
    let minVal = Infinity;
    let maxVal = -Infinity;

    points.forEach(p => {
      minVal = Math.min(minVal, p.baseline, p.atRisk, p.protected, p.threshold);
      maxVal = Math.max(maxVal, p.baseline, p.atRisk, p.protected, p.threshold);
    });

    // Add 15% headroom and floor
    const valRange = maxVal - minVal || 100000;
    minVal = Math.floor((minVal - valRange * 0.1) / 50000) * 50000;
    maxVal = Math.ceil((maxVal + valRange * 0.15) / 50000) * 50000;

    // Coordinate transforms
    const pointsCount = points.length;
    const getX = (idx) => padLeft + (idx / Math.max(1, pointsCount - 1)) * plotWidth;
    const getY = (val) => padTop + plotHeight - ((val - minVal) / (maxVal - minVal)) * plotHeight;

    // Clear Canvas
    this.ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid Lines and Y-Axis Labels
    const yGridSteps = 5;
    this.ctx.strokeStyle = '#E2E8F0';
    this.ctx.lineWidth = 1;
    this.ctx.font = '11px Inter, sans-serif';
    this.ctx.fillStyle = '#64748B';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    for (let i = 0; i <= yGridSteps; i++) {
      const gridVal = minVal + (i / yGridSteps) * (maxVal - minVal);
      const y = getY(gridVal);

      this.ctx.beginPath();
      this.ctx.moveTo(padLeft, y);
      this.ctx.lineTo(width - padRight, y);
      this.ctx.stroke();

      const label = Math.abs(gridVal) >= 100000
        ? `${this.currencySymbol}${(gridVal / 100000).toFixed(1)}L`
        : `${this.currencySymbol}${(gridVal / 1000).toFixed(0)}k`;
      this.ctx.fillText(label, padLeft - 10, y);
    }

    // 2. Draw Safety Buffer Zone / Threshold
    if (this.visibleSeries.threshold && this.data.safetyBuffer) {
      const thresholdY = getY(this.data.safetyBuffer);
      
      // Shaded danger zone below threshold
      this.ctx.fillStyle = 'rgba(220, 38, 38, 0.04)';
      this.ctx.fillRect(padLeft, thresholdY, plotWidth, getY(minVal) - thresholdY);

      // Dashed safety threshold line
      this.ctx.setLineDash([5, 4]);
      this.ctx.strokeStyle = '#D97706';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(padLeft, thresholdY);
      this.ctx.lineTo(width - padRight, thresholdY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Label
      this.ctx.fillStyle = '#D97706';
      this.ctx.font = '600 10px Inter, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('Minimum Safety Threshold', padLeft + 8, thresholdY - 8);
    }

    // 3. Draw X-Axis Labels (Timeline)
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = '#64748B';
    this.ctx.font = '11px Inter, sans-serif';

    const xLabelStep = pointsCount <= 8 ? 1 : (pointsCount <= 16 ? 2 : (pointsCount <= 31 ? 5 : 15));
    for (let i = 0; i < pointsCount; i += xLabelStep) {
      const x = getX(i);
      const pt = points[i];
      this.ctx.fillText(`D${pt.day}`, x, height - padBottom + 10);
    }

    // Helper to draw smooth curves
    const drawSeries = (key, color, fillGradient, lineWidth = 2.5) => {
      if (!this.visibleSeries[key]) return;

      this.ctx.beginPath();
      this.ctx.moveTo(getX(0), getY(points[0][key]));

      for (let i = 1; i < pointsCount; i++) {
        const prevX = getX(i - 1);
        const prevY = getY(points[i - 1][key]);
        const curX = getX(i);
        const curY = getY(points[i][key]);

        const cpX1 = prevX + (curX - prevX) / 2;
        const cpY1 = prevY;
        const cpX2 = prevX + (curX - prevX) / 2;
        const cpY2 = curY;

        this.ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, curX, curY);
      }

      // Fill area under curve
      if (fillGradient) {
        this.ctx.lineTo(getX(pointsCount - 1), getY(minVal));
        this.ctx.lineTo(getX(0), getY(minVal));
        this.ctx.closePath();
        this.ctx.fillStyle = fillGradient;
        this.ctx.fill();

        // Redraw line stroke
        this.ctx.beginPath();
        this.ctx.moveTo(getX(0), getY(points[0][key]));
        for (let i = 1; i < pointsCount; i++) {
          const prevX = getX(i - 1);
          const prevY = getY(points[i - 1][key]);
          const curX = getX(i);
          const curY = getY(points[i][key]);
          const cpX1 = prevX + (curX - prevX) / 2;
          const cpX2 = prevX + (curX - prevX) / 2;
          this.ctx.bezierCurveTo(cpX1, prevY, cpX2, curY, curX, curY);
        }
      }

      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    };

    // Draw At-Risk Scenario (Stress - Rose)
    drawSeries('atRisk', '#DC2626', null, 2);

    // Draw Baseline Forecast (Fintech Blue with soft gradient)
    const baselineGrad = this.ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    baselineGrad.addColorStop(0, 'rgba(37, 99, 235, 0.12)');
    baselineGrad.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
    drawSeries('baseline', '#2563EB', baselineGrad, 2.5);

    // Draw Shield Protected Scenario (Emerald)
    drawSeries('protected', '#059669', null, 2.5);

    // 4. Hover Crosshair & Pointer Dots
    if (this.hoverIndex >= 0 && this.hoverIndex < pointsCount) {
      const hX = getX(this.hoverIndex);
      const curPt = points[this.hoverIndex];

      // Vertical crosshair line
      this.ctx.strokeStyle = '#94A3B8';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.moveTo(hX, padTop);
      this.ctx.lineTo(hX, height - padBottom);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Indicator dots
      const drawDot = (val, strokeColor, fillColor = '#FFFFFF') => {
        const y = getY(val);
        this.ctx.beginPath();
        this.ctx.arc(hX, y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.stroke();
      };

      if (this.visibleSeries.baseline) drawDot(curPt.baseline, '#2563EB');
      if (this.visibleSeries.atRisk) drawDot(curPt.atRisk, '#DC2626');
      if (this.visibleSeries.protected) drawDot(curPt.protected, '#059669');
    }
  }
}
