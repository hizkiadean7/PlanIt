"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const EditItemModal = ({ isOpen, onClose, item }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])

  const [activity, setActivity] = useState({
    activityTitle: "",
    activityDescription: "",
    activityCategory: "",
    activityUrgency: "medium",
    activityDate: "",
    activityStartTime: "",
    activityEndTime: "",
  })

  const [goal, setGoal] = useState({
    goalTitle: "",
    goalDescription: "",
    goalCategory: "",
    goalProgress: "not-started",
  })

  const [timelines, setTimelines] = useState([
    {
      timelineId: null,
      timelineTitle: "",
      timelineStartDate: "",
      timelineEndDate: "",
      timelineStartTime: "",
      timelineEndTime: "",
    },
  ])

  const [meeting, setMeeting] = useState({
    meetingTitle: "",
    meetingDescription: "",
    meetingDate: "",
    meetingStartTime: "",
    meetingEndTime: "",
    members: [],
    newMemberEmails: [""],
    removedMembers: [],
  })

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user.id || null
  }

  // Fetch existing data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingData()
    }
  }, [isOpen])

  const fetchExistingData = async () => {
    try {
      const userId = getUserId()

      const activitiesResponse = await fetch(`${API_URL}/api/activities?userId=${userId}`)
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }

      const goalsResponse = await fetch(`${API_URL}/api/goals?userId=${userId}`)
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(goalsData.goals || [])
      }

      const teamsResponse = await fetch(`${API_URL}/api/teams?userId=${userId}`)
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData.teams || [])
      }
    } catch (error) {
      console.error("Error fetching existing data:", error)
    }
  }
  
  const fetchMeetingDetails = async (meetingId) => {
    try {
      const team = teams.find((t) => t.meetings && t.meetings.some((m) => m.teammeetingid === meetingId))
      if (team) {
        const response = await fetch(`${API_URL}/api/teams/${team.teamid}`)
        if (response.ok) {
          const data = await response.json()
          const meetingData = data.team.meetings.find((m) => m.teammeetingid === meetingId)
          if (meetingData) {
            setMeeting({
              meetingTitle: meetingData.meetingtitle || "",
              meetingDescription: meetingData.meetingdescription || "",
              meetingDate: meetingData.meetingdate || "",
              meetingStartTime: meetingData.meetingstarttime || "",
              meetingEndTime: meetingData.meetingendtime || "",
              members: meetingData.members || [],
              newMemberEmails: [""],
              removedMembers: [],
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching meeting details:", error)
    }
  }

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      if (item.type === "activity") {
        setActivity({
          activityTitle: item.activitytitle || "",
          activityDescription: item.activitydescription || "",
          activityCategory: item.activitycategory || "",
          activityUrgency: item.activityurgency || "medium",
          activityDate: item.activitydate || "",
          activityStartTime: item.activitystarttime || "",
          activityEndTime: item.activityendtime || "",
        })
      } else if (item.type === "goal") {
        setGoal({
          goalTitle: item.goaltitle || "",
          goalDescription: item.goaldescription || "",
          goalCategory: item.goalcategory || "",
          goalProgress: item.goalprogress || "not-started",
        })

        if (item.timelines && item.timelines.length > 0) {
          setTimelines(
            item.timelines.map((timeline) => ({
              timelineId: timeline.timelineid,
              timelineTitle: timeline.timelinetitle || "",
              timelineStartDate: timeline.timelinestartdate || "",
              timelineEndDate: timeline.timelineenddate || "",
              timelineStartTime: timeline.timelinestarttime || "",
              timelineEndTime: timeline.timelineendtime || "",
            })),
          )
        }
      } else if (item.type === "meeting") {
        fetchMeetingDetails(item.id)
      }
    }
  }, [item, teams])

  const handleActivityChange = (e) => {
    const { name, value } = e.target
    setActivity({
      ...activity,
      [name]: value,
    })
  }

  const handleGoalChange = (e) => {
    const { name, value } = e.target
    setGoal({
      ...goal,
      [name]: value,
    })
  }

  const handleMeetingChange = (e) => {
    const { name, value } = e.target
    setMeeting({
      ...meeting,
      [name]: value,
    })
  }

  const handleTimelineChange = (index, e) => {
    const { name, value } = e.target
    const updatedTimelines = [...timelines]
    updatedTimelines[index] = {
      ...updatedTimelines[index],
      [name]: value,
    }
    setTimelines(updatedTimelines)
  }
  
  const handleDeleteGoal = async () => {
    if (!item || item.type !== 'goal') return

    if (!window.confirm("Are you sure you want to delete this goal and all its timelines? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setApiError("")
    setSuccessMessage("")

    try {
      const response = await fetch(`${API_URL}/api/goals/${item.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccessMessage("Goal deleted successfully!")
        window.dispatchEvent(new CustomEvent("refreshCalendarData"))
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        const data = await response.json()
        setApiError(data.message || "Failed to delete goal.")
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
      setApiError("A network error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const addTimeline = () => {
    setTimelines([
      ...timelines,
      {
        timelineId: null,
        timelineTitle: "",
        timelineStartDate: "",
        timelineEndDate: "",
        timelineStartTime: "",
        timelineEndTime: "",
      },
    ])
  }

  const removeTimeline = (index) => {
    if (timelines.length > 1) {
      const updatedTimelines = [...timelines]
      updatedTimelines.splice(index, 1)
      setTimelines(updatedTimelines)
    }
  }

  const handleNewMemberEmailChange = (index, value) => {
    const updatedEmails = [...meeting.newMemberEmails]
    updatedEmails[index] = value
    setMeeting({
      ...meeting,
      newMemberEmails: updatedEmails,
    })
  }

  const addNewMemberEmail = () => {
    setMeeting({
      ...meeting,
      newMemberEmails: [...meeting.newMemberEmails, ""],
    })
  }

  const removeNewMemberEmail = (index) => {
    if (meeting.newMemberEmails.length > 1) {
      const updatedEmails = [...meeting.newMemberEmails]
      updatedEmails.splice(index, 1)
      setMeeting({
        ...meeting,
        newMemberEmails: updatedEmails,
      })
    }
  }

  const removeMember = (member) => {
    const updatedMembers = meeting.members.filter((m) => m.userid !== member.userid)
    setMeeting({
      ...meeting,
      members: updatedMembers,
      removedMembers: [...meeting.removedMembers, member],
    })
  }

  const checkActivityOverlaps = (newActivity) => {
    if (!newActivity.activityStartTime || !newActivity.activityEndTime) {
      return []
    }

    const newStart = new Date(`${newActivity.activityDate}T${newActivity.activityStartTime}`)
    const newEnd = new Date(`${newActivity.activityDate}T${newActivity.activityEndTime}`)

    const overlaps = []

    // Check against existing activities (excluding current one)
    activities.forEach((existingActivity) => {
      if (existingActivity.activityid === item.id) return // Skip current item
      if (existingActivity.activitydate !== newActivity.activityDate) return
      if (!existingActivity.activitystarttime || !existingActivity.activityendtime) return

      const existingStart = new Date(`${existingActivity.activitydate}T${existingActivity.activitystarttime}`)
      const existingEnd = new Date(`${existingActivity.activitydate}T${existingActivity.activityendtime}`)

      if (newStart < existingEnd && newEnd > existingStart) {
        overlaps.push({
          type: "activity",
          title: existingActivity.activitytitle,
          time: `${existingActivity.activitystarttime} - ${existingActivity.activityendtime}`,
        })
      }
    })

    // Check against goal timelines
    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((timeline) => {
          const timelineStart = new Date(timeline.timelinestartdate)
          const timelineEnd = new Date(timeline.timelineenddate)
          const activityDate = new Date(newActivity.activityDate)

          if (activityDate >= timelineStart && activityDate <= timelineEnd) {
            if (timeline.timelinestarttime && timeline.timelineendtime) {
              const timelineStartTime = new Date(`${newActivity.activityDate}T${timeline.timelinestarttime}`)
              const timelineEndTime = new Date(`${newActivity.activityDate}T${timeline.timelineendtime}`)

              if (newStart < timelineEndTime && newEnd > timelineStartTime) {
                overlaps.push({
                  type: "goal",
                  title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                  time: `${timeline.timelinestarttime} - ${timeline.timelineendtime}`,
                })
              }
            } else {
              overlaps.push({
                type: "goal",
                title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                time: "All day",
              })
            }
          }
        })
      }
    })

    // Check against team meetings
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          if (meeting.meetingdate !== newActivity.activityDate) return
          if (!meeting.meetingstarttime || !meeting.meetingendtime) return

          const meetingStart = new Date(`${meeting.meetingdate}T${meeting.meetingstarttime}`)
          const meetingEnd = new Date(`${meeting.meetingdate}T${meeting.meetingendtime}`)

          if (newStart < meetingEnd && newEnd > meetingStart) {
            overlaps.push({
              type: "meeting",
              title: meeting.meetingtitle,
              time: `${meeting.meetingstarttime} - ${meeting.meetingendtime}`,
            })
          }
        })
      }
    })

    return overlaps
  }

  // Check for goal timeline overlaps (excluding current item)
  const checkGoalTimelineOverlaps = (newTimeline) => {
    const overlaps = []

    if (!newTimeline.timelineStartDate || !newTimeline.timelineEndDate) {
      return overlaps
    }

    const newStart = new Date(newTimeline.timelineStartDate)
    const newEnd = new Date(newTimeline.timelineEndDate)

    // Check against existing activities
    activities.forEach((activity) => {
      const activityDate = new Date(activity.activitydate)

      if (activityDate >= newStart && activityDate <= newEnd) {
        if (
          newTimeline.timelineStartTime &&
          newTimeline.timelineEndTime &&
          activity.activitystarttime &&
          activity.activityendtime
        ) {
          const timelineStartTime = new Date(`${activity.activitydate}T${newTimeline.timelineStartTime}`)
          const timelineEndTime = new Date(`${activity.activitydate}T${newTimeline.timelineEndTime}`)
          const activityStart = new Date(`${activity.activitydate}T${activity.activitystarttime}`)
          const activityEnd = new Date(`${activity.activitydate}T${activity.activityendtime}`)

          if (timelineStartTime < activityEnd && timelineEndTime > activityStart) {
            overlaps.push({
              type: "activity",
              title: activity.activitytitle,
              time: `${activity.activitystarttime} - ${activity.activityendtime}`,
              date: activity.activitydate,
            })
          }
        } else {
          overlaps.push({
            type: "activity",
            title: activity.activitytitle,
            time: activity.activitystarttime
              ? `${activity.activitystarttime} - ${activity.activityendtime}`
              : "All day",
            date: activity.activitydate,
          })
        }
      }
    })

    // Check against other goal timelines (excluding current goal)
    goals.forEach((goal) => {
      if (goal.goalid === item.id) return // Skip current goal
      if (goal.timelines) {
        goal.timelines.forEach((existingTimeline) => {
          const existingStart = new Date(existingTimeline.timelinestartdate)
          const existingEnd = new Date(existingTimeline.timelineenddate)

          if (newStart <= existingEnd && newEnd >= existingStart) {
            if (
              newTimeline.timelineStartTime &&
              newTimeline.timelineEndTime &&
              existingTimeline.timelinestarttime &&
              existingTimeline.timelineendtime
            ) {
              const commonDay = new Date(Math.max(newStart.getTime(), existingStart.getTime()))
              const newTimelineStartTime = new Date(`${commonDay.toDateString()} ${newTimeline.timelineStartTime}`)
              const newTimelineEndTime = new Date(`${commonDay.toDateString()} ${newTimeline.timelineEndTime}`)
              const existingTimelineStartTime = new Date(`${commonDay.toDateString()} ${existingTimeline.timelinestarttime}`)
              const existingTimelineEndTime = new Date(`${commonDay.toDateString()} ${existingTimeline.timelineendtime}`)

              if (newTimelineStartTime < existingTimelineEndTime && newTimelineEndTime > existingTimelineStartTime) {
                overlaps.push({
                  type: "goal",
                  title: `${goal.goaltitle} - ${existingTimeline.timelinetitle}`,
                  time: `${existingTimeline.timelinestarttime} - ${existingTimeline.timelineendtime}`,
                  date: `${existingTimeline.timelinestartdate} to ${existingTimeline.timelineenddate}`,
                })
              }
            }
          }
        })
      }
    })

    // Check against team meetings
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          const meetingDate = new Date(meeting.meetingdate)

          if (meetingDate >= newStart && meetingDate <= newEnd) {
            if (
              newTimeline.timelineStartTime &&
              newTimeline.timelineEndTime &&
              meeting.meetingstarttime &&
              meeting.meetingendtime
            ) {
              const timelineStartTime = new Date(`${meeting.meetingdate}T${newTimeline.timelineStartTime}`)
              const timelineEndTime = new Date(`${meeting.meetingdate}T${newTimeline.timelineEndTime}`)
              const meetingStart = new Date(`${meeting.meetingdate}T${meeting.meetingstarttime}`)
              const meetingEnd = new Date(`${meeting.meetingdate}T${meeting.meetingendtime}`)

              if (timelineStartTime < meetingEnd && timelineEndTime > meetingStart) {
                overlaps.push({
                  type: "meeting",
                  title: meeting.meetingtitle,
                  time: `${meeting.meetingstarttime} - ${meeting.meetingendtime}`,
                  date: meeting.meetingdate,
                })
              }
            } else {
              overlaps.push({
                type: "meeting",
                title: meeting.meetingtitle,
                time: meeting.meetingstarttime ? `${meeting.meetingstarttime} - ${meeting.meetingendtime}` : "All day",
                date: meeting.meetingdate,
              })
            }
          }
        })
      }
    })

    return overlaps
  }

  // Check for meeting overlaps (excluding current item)
  const checkMeetingOverlaps = (newMeeting) => {
    if (!newMeeting.meetingStartTime || !newMeeting.meetingEndTime) {
      return []
    }

    const newStart = new Date(`${newMeeting.meetingDate}T${newMeeting.meetingStartTime}`)
    const newEnd = new Date(`${newMeeting.meetingDate}T${newMeeting.meetingEndTime}`)

    const overlaps = []

    // Check against existing activities
    activities.forEach((activity) => {
      if (activity.activitydate !== newMeeting.meetingDate) return
      if (!activity.activitystarttime || !activity.activityendtime) return

      const activityStart = new Date(`${activity.activitydate}T${activity.activitystarttime}`)
      const activityEnd = new Date(`${activity.activitydate}T${activity.activityendtime}`)

      if (newStart < activityEnd && newEnd > activityStart) {
        overlaps.push({
          type: "activity",
          title: activity.activitytitle,
          time: `${activity.activitystarttime} - ${activity.activityendtime}`,
        })
      }
    })

    // Check against goal timelines
    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((timeline) => {
          const timelineStart = new Date(timeline.timelinestartdate)
          const timelineEnd = new Date(timeline.timelineenddate)
          const meetingDate = new Date(newMeeting.meetingDate)

          if (meetingDate >= timelineStart && meetingDate <= timelineEnd) {
            if (timeline.timelinestarttime && timeline.timelineendtime) {
              const timelineStartTime = new Date(`${newMeeting.meetingDate}T${timeline.timelinestarttime}`)
              const timelineEndTime = new Date(`${newMeeting.meetingDate}T${timeline.timelineendtime}`)

              if (newStart < timelineEndTime && newEnd > timelineStartTime) {
                overlaps.push({
                  type: "goal",
                  title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                  time: `${timeline.timelinestarttime} - ${timeline.timelineendtime}`,
                })
              }
            } else {
              overlaps.push({
                type: "goal",
                title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                time: "All day",
              })
            }
          }
        })
      }
    })

    // Check against other team meetings (excluding current one)
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          if (meeting.teammeetingid === item.id) return // Skip current meeting
          if (meeting.meetingdate !== newMeeting.meetingDate) return
          if (!meeting.meetingstarttime || !meeting.meetingendtime) return

          const meetingStart = new Date(`${meeting.meetingdate}T${meeting.meetingstarttime}`)
          const meetingEnd = new Date(`${meeting.meetingdate}T${meeting.meetingendtime}`)

          if (newStart < meetingEnd && newEnd > meetingStart) {
            overlaps.push({
              type: "meeting",
              title: meeting.meetingtitle,
              time: `${meeting.meetingstarttime} - ${meeting.meetingendtime}`,
            })
          }
        })
      }
    })

    return overlaps
  }

  // Validate activity form
  const validateActivityForm = () => {
    if (!activity.activityTitle.trim()) {
      setApiError("Activity title is required")
      return false
    }
    if (!activity.activityDate) {
      setApiError("Activity date is required")
      return false
    }
    return true
  }

  // Validate goal form
  const validateGoalForm = () => {
    if (!goal.goalTitle.trim()) {
      setApiError("Goal title is required")
      return false
    }

    const validTimeline = timelines.some(
      (timeline) => timeline.timelineTitle.trim() && timeline.timelineStartDate && timeline.timelineEndDate,
    )

    if (!validTimeline) {
      setApiError("At least one timeline with title, start date, and end date is required")
      return false
    }

    return true
  }

  const validateMeetingForm = () => {
    if (!meeting.meetingTitle.trim()) {
      setApiError("Meeting title is required")
      return false
    }
    if (!meeting.meetingDate) {
      setApiError("Meeting date is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (item.type === "activity") {
        if (!validateActivityForm()) {
          setIsLoading(false)
          return
        }
        
        const overlaps = checkActivityOverlaps(activity)
        if (overlaps.length > 0) {
          const overlapDetails = overlaps
            .map((overlap) => `• ${overlap.title} (${overlap.time}) [${overlap.type}]`)
            .join("\n")

          const confirmOverlap = window.confirm(
            `This activity intersects with the following items:\n\n${overlapDetails}\n\nDo you want to continue?`,
          )
          if (!confirmOverlap) {
            setIsLoading(false)
            return
          }
        }

        const activityData = {
          activityTitle: activity.activityTitle,
          activityDescription: activity.activityDescription,
          activityCategory: activity.activityCategory,
          activityUrgency: activity.activityUrgency,
          activityDate: activity.activityDate,
          activityStartTime: activity.activityStartTime,
          activityEndTime: activity.activityEndTime,
        }

        const response = await fetch(`${API_URL}/api/activities/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activityData),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccessMessage("Activity updated successfully!")
          window.dispatchEvent(new CustomEvent("refreshCalendarData"))

          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update activity:", data)
          setApiError(data.message || "Failed to update activity. Please try again.")
        }
      } else if (item.type === "goal") {
        if (!validateGoalForm()) {
          setIsLoading(false)
          return
        }
        
        const allOverlaps = []
        timelines.forEach((timeline, index) => {
          if (timeline.timelineTitle.trim() && timeline.timelineStartDate && timeline.timelineEndDate) {
            const overlaps = checkGoalTimelineOverlaps(timeline)
            if (overlaps.length > 0) {
              allOverlaps.push({
                timelineIndex: index + 1,
                timelineTitle: timeline.timelineTitle,
                overlaps: overlaps,
              })
            }
          }
        })

        if (allOverlaps.length > 0) {
          let overlapMessage = "The following goal timelines have intersections:\n\n"
          allOverlaps.forEach(({ timelineIndex, timelineTitle, overlaps }) => {
            overlapMessage += `Timeline ${timelineIndex} (${timelineTitle}):\n`
            overlaps.forEach((overlap) => {
              overlapMessage += `  • ${overlap.title} (${overlap.time}) [${overlap.type}]\n`
            })
            overlapMessage += "\n"
          })
          overlapMessage += "Do you want to continue?"

          const confirmOverlap = window.confirm(overlapMessage)
          if (!confirmOverlap) {
            setIsLoading(false)
            return
          }
        }

        const goalData = {
          goalTitle: goal.goalTitle,
          goalDescription: goal.goalDescription,
          goalCategory: goal.goalCategory,
          goalProgress: goal.goalProgress,
          timelines: timelines.map((timeline) => ({
            timelineId: timeline.timelineId,
            timelineTitle: timeline.timelineTitle,
            timelineStartDate: timeline.timelineStartDate,
            timelineEndDate: timeline.timelineEndDate,
            timelineStartTime: timeline.timelineStartTime,
            timelineEndTime: timeline.timelineEndTime,
          })),
        }

        const response = await fetch(`${API_URL}/api/goals/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(goalData),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccessMessage("Goal updated successfully!")
          window.dispatchEvent(new CustomEvent("refreshCalendarData"))

          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update goal:", data)
          setApiError(data.message || "Failed to update goal. Please try again.")
        }
      } else if (item.type === "meeting") {
        if (!validateMeetingForm()) {
          setIsLoading(false)
          return
        }

        if (meeting.meetingStartTime && meeting.meetingEndTime) {
          const overlaps = checkMeetingOverlaps(meeting)
          if (overlaps.length > 0) {
            const overlapDetails = overlaps
              .map((overlap) => `• ${overlap.title} (${overlap.time}) [${overlap.type}]`)
              .join("\n")

            const confirmOverlap = window.confirm(
              `This meeting intersects with the following items:\n\n${overlapDetails}\n\nDo you want to continue?`,
            )
            if (!confirmOverlap) {
              setIsLoading(false)
              return
            }
          }
        }
        
        const team = teams.find((t) => t.meetings && t.meetings.some((m) => m.teammeetingid === item.id))
        const originalMeeting = team?.meetings.find((m) => m.teammeetingid === item.id)

        const meetingData = {
          meetingTitle: meeting.meetingTitle,
          meetingDescription: meeting.meetingDescription,
          meetingDate: meeting.meetingDate,
          meetingStartTime: meeting.meetingStartTime,
          meetingEndTime: meeting.meetingEndTime,
          newMemberEmails: meeting.newMemberEmails.filter((email) => email.trim()),
          removedMemberIds: meeting.removedMembers.map((member) => member.userid),
          originalMeeting: originalMeeting,
        }

        const response = await fetch(`${API_URL}/api/meetings/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(meetingData),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccessMessage("Meeting updated successfully!")
          window.dispatchEvent(new CustomEvent("refreshCalendarData"))
          window.dispatchEvent(new CustomEvent("refreshTeamData"))

          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update meeting:", data)
          setApiError(data.message || "Failed to update meeting. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setApiError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 edit-item-modal-container">
      <div className="bg-gray-800 text-gray-300 rounded-lg border-1 border-gray-700 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Edit {item.type === "activity" ? "Activity" : item.type === "goal" ? "Goal" : "Meeting"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Status messages */}
        {apiError && (
          <div className="mx-6 mt-4 flex items-center p-3 bg-red-900 bg-opacity-50 border border-red-700 text-red-300 rounded">
            <AlertCircle size={18} className="mr-2" />
            {apiError}
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 flex items-center p-3 bg-green-900 bg-opacity-50 border border-green-700 text-green-300 rounded">
            <CheckCircle size={18} className="mr-2" />
            {successMessage}
          </div>
        )}

        {/* Form content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {item.type === "activity" ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Activity Title</label>
                  <input
                    type="text"
                    name="activityTitle"
                    value={activity.activityTitle}
                    onChange={handleActivityChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    name="activityDescription"
                    value={activity.activityDescription}
                    onChange={handleActivityChange}
                    rows="3"
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select
                    name="activityCategory"
                    value={activity.activityCategory}
                    onChange={handleActivityChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="social">Social</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Urgency</label>
                  <select
                    name="activityUrgency"
                    value={activity.activityUrgency}
                    onChange={handleActivityChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    name="activityDate"
                    value={activity.activityDate}
                    onChange={handleActivityChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="activityStartTime"
                      value={activity.activityStartTime}
                      onChange={handleActivityChange}
                      className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                    <input
                      type="time"
                      name="activityEndTime"
                      value={activity.activityEndTime}
                      onChange={handleActivityChange}
                      className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Activity"}
                </button>
              </div>
            </form>
          ) : item.type === "goal" ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Goal Title</label>
                  <input
                    type="text"
                    name="goalTitle"
                    value={goal.goalTitle}
                    onChange={handleGoalChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    name="goalDescription"
                    value={goal.goalDescription}
                    onChange={handleGoalChange}
                    rows="3"
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select
                    name="goalCategory"
                    value={goal.goalCategory}
                    onChange={handleGoalChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    <option value="career">Career</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Progress</label>
                  <select
                    name="goalProgress"
                    value={goal.goalProgress}
                    onChange={handleGoalChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-white">Timelines</h3>
                  <button
                    type="button"
                    onClick={addTimeline}
                    className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" /> Add Timeline
                  </button>
                </div>

                {timelines.map((timeline, index) => (
                  <div key={index} className="border border-gray-700 rounded-md p-4 mb-4 bg-gray-900">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-white">Timeline {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeTimeline(index)}
                        className="text-red-400 hover:text-red-300"
                        disabled={timelines.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                          type="text"
                          name="timelineTitle"
                          value={timeline.timelineTitle}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                        <input
                          type="date"
                          name="timelineStartDate"
                          value={timeline.timelineStartDate}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                        <input
                          type="date"
                          name="timelineEndDate"
                          value={timeline.timelineEndDate}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                        <input
                          type="time"
                          name="timelineStartTime"
                          value={timeline.timelineStartTime}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                        <input
                          type="time"
                          name="timelineEndTime"
                          value={timeline.timelineEndTime}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-6">
                <div>
                  <button
                    type="button"
                    onClick={handleDeleteGoal}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 flex items-center"
                    disabled={isLoading || isDeleting}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Goal"}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 mr-2"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Goal"}
                  </button>
                </div>
              </div>
            </form>
          ) : item.type === "meeting" ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Meeting Title</label>
                  <input
                    type="text"
                    name="meetingTitle"
                    value={meeting.meetingTitle}
                    onChange={handleMeetingChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    name="meetingDescription"
                    value={meeting.meetingDescription}
                    onChange={handleMeetingChange}
                    rows="3"
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    name="meetingDate"
                    value={meeting.meetingDate}
                    onChange={handleMeetingChange}
                    className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="meetingStartTime"
                      value={meeting.meetingStartTime}
                      onChange={handleMeetingChange}
                      className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                    <input
                      type="time"
                      name="meetingEndTime"
                      value={meeting.meetingEndTime}
                      onChange={handleMeetingChange}
                      className="bg-gray-700 text-white w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Current Members Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Members {item.invitationtype === 'mandatory' && '(Mandatory)'}
                </label>
                <div className="space-y-2 mb-3">
                  {meeting.members &&
                    meeting.members.map((member) => (
                      <div key={member.userid} className="flex items-center justify-between bg-gray-900 rounded p-3">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-white">{member.username}</span>
                          <span className="text-xs text-gray-400 ml-2">({member.useremail})</span>
                          {item.invitationtype === 'request' && (
                            <span
                                className={`text-xs px-2 py-1 rounded ml-2 ${
                                member.status === "accepted"
                                    ? "bg-green-900 text-green-300"
                                    : member.status === "declined"
                                    ? "bg-red-900 text-red-300"
                                    : "bg-yellow-900 text-yellow-300"
                                }`}
                            >
                                {member.status}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(member)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  {(!meeting.members || meeting.members.length === 0) && (
                    <p className="text-sm text-gray-400">No current members</p>
                  )}
                </div>
              </div>

              {/* Add New Members Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">Add New Members</label>
                  <button
                    type="button"
                    onClick={addNewMemberEmail}
                    className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" /> Add Email Field
                  </button>
                </div>
                {meeting.newMemberEmails.map((email, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleNewMemberEmailChange(index, e.target.value)}
                      className="bg-gray-700 text-white flex-1 p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email to add new member"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewMemberEmail(index)}
                      className="ml-2 text-red-400 hover:text-red-300"
                      disabled={meeting.newMemberEmails.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Meeting"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default EditItemModal
