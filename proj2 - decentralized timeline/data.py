import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from scipy.optimize import curve_fit

f = open("data.txt", "r")
data = f.read()
data = data.split("Post: ")
data = list(filter(lambda val: val != "", data))

meanTimes = []

for val in data:
    times = val.split("\n")
    times = list(filter(lambda time: time != "", times))
    first = int(times[0])
    # print(times[1:])
    sum = 0
    for time in times[1:]:
        time = int(time)
        sum += time - first
    
    size = len(times)
    meanTimes.append((size,sum/size))
    # if size not in dict.keys():
    #     dict[size] = [sum/size]
    # else: dict[size].append(sum/size)

# print(meanTimes)
df = pd.DataFrame([val for val in meanTimes], columns=['nodes', 'time'])
df = df[df['time'] < 3000]
# print(df)
# sns.lmplot(x="nodes", y="time", data=df, fit_reg=True)


popt, pcov = curve_fit(lambda t, a, b, c: a * np.exp(b * t) + c, df['nodes'], df['time'])
a = popt[0]
b = popt[1]
c = popt[2]
# Create the fitted curve
x_fitted = np.linspace(np.min( df['nodes'],), np.max(df['nodes']), 100)
y_fitted = a * np.exp(b * x_fitted) + c

# Plot
ax = plt.axes()
ax.scatter(df['nodes'], df['time'], label='Raw data')
ax.plot(x_fitted, y_fitted, 'k', label='Fitted curve')
ax.set_title('Delay to received post')
ax.set_ylabel('Time (ms)')
ax.set_ylim(0, 3000)
ax.set_xlabel('Number of nodes')
ax.legend()
plt.show()


