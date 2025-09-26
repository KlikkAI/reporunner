{
  _id: '$type', count;
  :
      $sum: 1
  ,
  ,
}
,
      ])

const analytics = {
  dateRange: Number(dateRange),
  sessions: sessionStats[0] || {
    totalSessions: 0,
    activeSessions: 0,
    averageParticipants: 0,
    totalParticipants: 0,
  },
  operations: operationStats.reduce(
    (acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    },
    {} as Record<string, number>
  ),
};

res.json(ApiResponse.success(analytics));
}
  )
}
