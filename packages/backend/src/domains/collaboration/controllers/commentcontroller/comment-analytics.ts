{
  _id: 1, commentCount;
  : 1,
          name: '$author.name',
          email: '$author.email',
  ,
}
,
    ])

const analytics = {
  dateRange: Number(dateRange),
  summary: commentStats[0] || {
    totalComments: 0,
    openComments: 0,
    resolvedComments: 0,
    totalReplies: 0,
    totalReactions: 0,
    averageRepliesPerComment: 0,
  },
  dailyActivity,
  topCommenters,
};

res.json(ApiResponse.success(analytics));
})
}
